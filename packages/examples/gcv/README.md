# Images Content Moderation

Images Content Moderation is a module that uses the Google Cloud Vision API to analyze images for moderation purposes. It can assess images for adult, violent, racy, spoof, and medical content, saving the results in a JSON file. The module is designed to help detect potentially inappropriate content in image datasets stored in a remote bucket.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Methods](#methods)
- [Example Output](#example-output)

## Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [Google Cloud Vision API](https://cloud.google.com/vision) enabled and credentials for access

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/humanprotocol/human-protocol.git
   ```

2. Navigate to the project directory:
   ```bash
   cd human-protocol/packages/examples/gcv
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up your Google Cloud Vision API credentials:
    ```bash 
    Create a `.env` file in the project directory (or rename `.env.example` to `.env`) and add  your credentials.
    ```

## Usage

To use the `VisionModeration` class, import and create an instance by providing the necessary credentials. Then, call `processDataset` with your dataset.

Example usage:

```typescript
import { VisionModeration } from './VisionModeration';
import { StorageDataDto } from './dto/storage';

const visionModeration = new VisionModeration('your-project-id', 'your-private-key', 'your-client-email');
const storageData = new StorageDataDto('your-bucket-name', 'your-folder-name');

visionModeration.processDataset(storageData)
  .then(response => {
    console.log('Moderation Results:', response);
  })
  .catch(error => {
    console.error('Error processing dataset:', error);
  });
```

## Methods

### `analyzeImagesForModeration(imageUrls: string[]): Promise<any[]>`
Analyzes a list of image URLs for moderation using the Google Cloud Vision API.

- **Parameters:** `imageUrls` - an array of URLs pointing to images in the dataset
- **Returns:** a list of moderation results, including scores for adult, violence, racy, spoof, and medical content.

### `saveResultsToJson(results: any[], jsonFilePath: string)`
Saves the moderation results to a JSON file at the specified path.

- **Parameters:**
  - `results`: the moderation results to save
  - `jsonFilePath`: the path where the JSON file should be saved

### `processDataset(storageData: StorageDataDto): Promise<{ containsAbuse: string; abuseResultsFile: string }>`
Processes all images in the dataset, analyzes them for inappropriate content, and saves results to `results.json`. It returns whether any abusive content was detected.

- **Parameters:** `storageData` - an object containing details about the storage dataset
- **Returns:** an object with:
  - `containsAbuse`: `"true"` if any content is marked as abusive, `"false"` otherwise
  - `abuseResultsFile`: the path to `results.json`

## Example Output

Example content of `results.json` file:

```json
[
  {
    "imageUrl": "https://yourapp.com/bucket/abuse.jpg",
    "moderationResult": {
      "adult": "VERY_LIKELY",
      "violence": "VERY_UNLIKELY",
      "racy": "VERY_LIKELY",
      "spoof": "VERY_UNLIKELY",
      "medical": "LIKELY"
    }
  },
  {
    "imageUrl": "https://yourapp.com/bucket/cat.jpg",
    "moderationResult": {
      "adult": "VERY_UNLIKELY",
      "violence": "UNLIKELY",
      "racy": "VERY_UNLIKELY",
      "spoof": "POSSIBLE",
      "medical": "VERY_UNLIKELY"
    }
  }
]
```

Example response from `processDataset`:

```json
{
  "containsAbuse": "true",
  "abuseResultsFile": "./results.json"
}
```