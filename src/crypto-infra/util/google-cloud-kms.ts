import { KeyManagementServiceClient } from '@google-cloud/kms';

const client = new KeyManagementServiceClient();

export default async function getDecryptedSeed() {
  // These should be in your Render environment variables
  const name = client.cryptoKeyPath(
    process.env.GCP_PROJECT_ID!,
    'global',
    'my-seed-keyring',
    'my-seed-key',
  );

  // The encrypted blob you got from the gcloud command
  const ciphertext = Buffer.from(process.env.ENCRYPTED_SEED_BASE64!, 'base64');

  const [result] = await client.decrypt({ name, ciphertext });

  // result.plaintext is a Buffer; convert to string to use in your crypto library
  return result.plaintext?.toString();
}
