import { Encryption } from '../src/encryption';

const ExampleKeys = {
  private: `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEZyOGRhYJKwYBBAHaRw8BAQdA6soD3CBjRnPfsYIxOGObykL8X8y+dZlf
IzAI7mk40E4AAQCPRLKy/1n/QxTRk/Ql+Dt2VYADqDmczBxhWELCbz9Wvw/J
zRxleGFtcGxlIDxzaW1wbGVAZXhhbXBsZS5jb20+wowEEBYKAD4FgmcjhkYE
CwkHCAmQZ4KBmVeekE0DFQgKBBYAAgECGQECmwMCHgEWIQQkzuPtNIUkzz4M
CFhngoGZV56QTQAA89oBAKm5Tai1Ynx4BCU6PSLp0QMEE2ImV/LzwHkLMz52
mzeJAP9NyyNyIMNH1SpSezy309UhEdJVapGoXQwO1eQR4B+LCMddBGcjhkYS
CisGAQQBl1UBBQEBB0BykPL7zxjKQpZMYuEnIDBz7vshngm4zJMNOsE6pDSH
NgMBCAcAAP9b+n3/5QKVd0UP/ow3uyH0X44gc2U4fKV8IhZBJLiSEA9ZwngE
GBYKACoFgmcjhkYJkGeCgZlXnpBNApsMFiEEJM7j7TSFJM8+DAhYZ4KBmVee
kE0AAE0WAP9FE0I9dHToxLAkMKiM9tTzL43GVl6K8Lvn9nrLJcfLgQEAtFXL
39GhAUKNbHMpdeEmxukrdF+rXzUfvOsYGPLIgwI=
=GfVY
-----END PGP PRIVATE KEY BLOCK-----`,
  public: `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEZyOGRhYJKwYBBAHaRw8BAQdA6soD3CBjRnPfsYIxOGObykL8X8y+dZlf
IzAI7mk40E7NHGV4YW1wbGUgPHNpbXBsZUBleGFtcGxlLmNvbT7CjAQQFgoA
PgWCZyOGRgQLCQcICZBngoGZV56QTQMVCAoEFgACAQIZAQKbAwIeARYhBCTO
4+00hSTPPgwIWGeCgZlXnpBNAADz2gEAqblNqLVifHgEJTo9IunRAwQTYiZX
8vPAeQszPnabN4kA/03LI3Igw0fVKlJ7PLfT1SER0lVqkahdDA7V5BHgH4sI
zjgEZyOGRhIKKwYBBAGXVQEFAQEHQHKQ8vvPGMpClkxi4ScgMHPu+yGeCbjM
kw06wTqkNIc2AwEIB8J4BBgWCgAqBYJnI4ZGCZBngoGZV56QTQKbDBYhBCTO
4+00hSTPPgwIWGeCgZlXnpBNAABNFgD/RRNCPXR06MSwJDCojPbU8y+NxlZe
ivC75/Z6yyXHy4EBALRVy9/RoQFCjWxzKXXhJsbpK3Rfq181H7zrGBjyyIMC
=wH1v
-----END PGP PUBLIC KEY BLOCK-----`,
};

const exampleRound = async () => {
  const encryption = await Encryption.build(ExampleKeys.private);

  const message = Buffer.from(
    JSON.stringify(
      {
        date: new Date().toISOString(),
        random: Math.random(),
        text: 'Hello from example!',
      },
      null,
      2
    )
  );

  const encrypted = await encryption.signAndEncrypt(message, [
    ExampleKeys.public,
  ]);

  const decrypted = await encryption.decrypt(encrypted, ExampleKeys.public);
  console.log('Decrypted', JSON.parse(Buffer.from(decrypted).toString()));
};

(async () => {
  await exampleRound();
})();
