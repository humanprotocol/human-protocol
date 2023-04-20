import express from 'express';
import bodyParser from 'body-parser';

// Define the data type for jobs
type Job = {
  address: string;
  chainId: number;
  title: string;
  description: string;
  token: string;
  estimatedPrice: number;
  solutionsRequired: number;
};

// Create an instance of Express application
const app = express();
app.use(bodyParser.json());
// Specify the port on which the API will run
const PORT = 3000;

// Example data for similar jobs
const jobs: Job[] = [
  {
    address: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb6',
    chainId: 80001,
    title: 'Job title 1',
    description: 'Job description 1',
    token: '0x670bCc966ddc4fE7136c8793617a2C4D22849827',
    estimatedPrice: 1,
    solutionsRequired: 2
  },
  {
    address: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb7',
    chainId: 80001,
    title: 'Job title 2',
    description: 'Job description 2',
    token: '0x670bCc966ddc4fE7136c8793617a2C4D22849827',
    estimatedPrice: 1,
    solutionsRequired: 3,
  },
  {
    address: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb8',
    chainId: 80001,
    title: 'Job title 3',
    description: 'Job description 3',
    token: '0x670bCc966ddc4fE7136c8793617a2C4D22849827',
    estimatedPrice: 2,
    solutionsRequired: 2
  },
  {
    address: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb9',
    chainId: 80001,
    title: 'Job title 4',
    description: 'Job description 4',
    token: '0x670bCc966ddc4fE7136c8793617a2C4D22849827',
    estimatedPrice: 3,
    solutionsRequired: 1
  },
  {
    address: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb10',
    chainId: 80001,
    title: 'Job title 5',
    description: 'Job description 5',
    token: '0x670bCc966ddc4fE7136c8793617a2C4D22849827',
    estimatedPrice: 2,
    solutionsRequired: 3
  },
];

// Endpoint to get the list of similar jobs
app.get('/jobs', (req, res) => {
  // Get the value of the workeraddress query parameter
  const workerAddress = req.query.workeraddress;

  if (!workerAddress || workerAddress === '') {
    return res.status(400).json({ error: 'workerAddress is required' });
  }
  // Return the filtered jobs
  res.json(jobs);
});

// Endpoint for sending solutions. Receive address, chainId, and solution
app.post('/jobs/solutions', (req, res) => {
  const { address, chainId, solution } = req.body;

  // Find the job in the jobs array based on the provided address and chainId
  const foundJob = jobs.find(
    (job) => job.address === address && job.chainId === Number(chainId)
  );

  // Check if the job exists and if the provided solution matches the required solutions
  if (foundJob) {
    res.json({ result: true });
  } else {
    res.json({ result: false });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
