import { Type } from '@sinclair/typebox';
import {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from 'fastify';
import { escrow as escrowSchema } from '../schemas/escrow';
import {
  ChainId,
  ESCROW_NETWORKS,
  IEscrowNetwork,
} from '../constants/networks';

const escrowPreValidations = function (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  const escrowData = request.body as typeof escrowSchema.properties;
  const fiat = escrowData?.fiat
    ? JSON.parse(escrowData?.fiat?.toString())
    : false;
  const paymentId = escrowData?.paymentId?.toString();
  if (request.url === '/escrow' && fiat && !paymentId)
    done(new Error('Invalid Payment Id'));
  const chainId = Number(escrowData.chainId) as ChainId;
  if (!chainId) done(new Error('Invalid Chain Id'));
  const network = ESCROW_NETWORKS[chainId];
  if (!network) done(new Error('Chain Id not supported'));
  done(undefined);
};

export const createEscrow: FastifyPluginAsync = async (server) => {
  let escrowData: typeof escrowSchema.properties;

  server.post(
    '/check-escrow',
    {
      preValidation: [escrowPreValidations],
      schema: {
        body: escrowSchema,
        response: {
          200: Type.Boolean(),
        },
      },
    },
    async function (request, reply) {
      const { escrow } = server;

      escrowData = request.body as typeof escrowSchema.properties;
      const description = escrowData.description as unknown as string;
      const title = escrowData.title as unknown as string;
      if (escrow.checkCurseWords(description) || escrow.checkCurseWords(title))
        return reply
          .status(400)
          .send('Title or description contains curse words');

      return true;
    }
  );

  server.post(
    '/escrow',
    {
      preValidation: [escrowPreValidations],
      schema: {
        body: escrowSchema,
        response: {
          200: Type.Object({
            escrowAddress: Type.String(),
            exchangeUrl: Type.String(),
          }),
        },
      },
    },
    async function (request, reply) {
      const { escrow, s3, web3, stripe, currency } = server;

      escrowData = request.body as typeof escrowSchema.properties;
      const chainId = Number(escrowData.chainId) as ChainId;
      const escrowNetwork = ESCROW_NETWORKS[chainId] as IEscrowNetwork;
      const fiat = escrowData?.fiat
        ? JSON.parse(escrowData?.fiat?.toString())
        : false;

      let funderAddress: string, fundAmount: string;
      const web3Client = web3.createWeb3(escrowNetwork);
      const jobRequester = escrowData.jobRequester as unknown as string;
      const token = escrowData.token as unknown as string;

      if (fiat) {
        funderAddress = web3Client.eth.defaultAccount as string;
        const payment = await stripe.getPayment(
          escrowData.paymentId.toString()
        );
        if (!payment || payment.status !== 'succeeded') {
          return reply
            .status(400)
            .send('Payment not found or has not yet been made correctly');
        }
        fundAmount = web3Client.utils.toWei(
          (
            await currency.getHMTPrice(payment.amount / 100, payment.currency)
          ).toString(),
          'ether'
        );

        if (
          !(await escrow.checkBalance(
            web3Client,
            token,
            funderAddress,
            fundAmount
          ))
        ) {
          return reply
            .status(400)
            .send(
              `Balance not enough for funding the escrow for payment ${payment.id}`
            );
        }
      } else {
        funderAddress = jobRequester;
        fundAmount = web3Client.utils.toWei(
          Number(escrowData.fundAmount).toString(),
          'ether'
        );
        if (
          !(await escrow.checkApproved(
            web3Client,
            token,
            funderAddress,
            fundAmount
          ))
        ) {
          return reply
            .status(400)
            .send('Balance or allowance not enough for funding the escrow');
        }
      }

      const description = escrowData.description as unknown as string;
      const title = escrowData.title as unknown as string;
      if (escrow.checkCurseWords(description) || escrow.checkCurseWords(title))
        return reply
          .status(400)
          .send('Title or description contains curse words');

      const escrowAddress = await escrow.createEscrow(
        web3Client,
        escrowNetwork.factoryAddress,
        token,
        jobRequester
      );
      await escrow.fundEscrow(
        web3Client,
        token,
        funderAddress,
        escrowAddress,
        fundAmount
      );
      const data = escrow.addOraclesData(escrowData);
      const url = await s3.uploadManifest(data, escrowAddress);
      await escrow.setupEscrow(web3Client, escrowAddress, url, jobRequester);
      return {
        escrowAddress,
        exchangeUrl: `${data.exchangeOracleUrl}?address=${escrowAddress}`,
      };
    }
  );
};
