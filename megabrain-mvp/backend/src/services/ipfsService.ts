import axios from 'axios';
import FormData from 'form-data';
import config from '../config';
import logger from '../utils/logger';

// ============================================
// IPFS Service
// Handles storing and retrieving results from IPFS
// Supports Pinata and nft.storage providers
// ============================================

class IPFSService {
  private enabled: boolean;
  private provider: 'pinata' | 'nftstorage';
  private gateway: string;

  constructor() {
    this.enabled = config.ipfs.enabled;
    this.provider = config.ipfs.provider;
    this.gateway = config.ipfs.gateway;
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: any, filename: string = 'data.json'): Promise<string | null> {
    if (!this.enabled) {
      logger.warn('IPFS is disabled, skipping upload');
      return null;
    }

    try {
      const jsonData = JSON.stringify(data);
      
      if (this.provider === 'pinata') {
        return await this.uploadToPinata(jsonData, filename);
      } else {
        return await this.uploadToNFTStorage(jsonData, filename);
      }
    } catch (error) {
      logger.error('Failed to upload to IPFS:', error);
      return null;
    }
  }

  /**
   * Upload file buffer to IPFS
   */
  async uploadFile(
    buffer: Buffer, 
    filename: string, 
    contentType: string = 'application/octet-stream'
  ): Promise<string | null> {
    if (!this.enabled) {
      logger.warn('IPFS is disabled, skipping upload');
      return null;
    }

    try {
      if (this.provider === 'pinata') {
        return await this.uploadFileToPinata(buffer, filename, contentType);
      } else {
        return await this.uploadFileToNFTStorage(buffer, filename, contentType);
      }
    } catch (error) {
      logger.error('Failed to upload file to IPFS:', error);
      return null;
    }
  }

  /**
   * Retrieve data from IPFS
   */
  async retrieveJSON<T>(ipfsHash: string): Promise<T | null> {
    if (!ipfsHash) return null;

    try {
      const url = this.getIPFSUrl(ipfsHash);
      const response = await axios.get(url, {
        timeout: 30000,
      });
      return response.data as T;
    } catch (error) {
      logger.error(`Failed to retrieve from IPFS (${ipfsHash}):`, error);
      return null;
    }
  }

  /**
   * Get full IPFS URL from hash
   */
  getIPFSUrl(ipfsHash: string): string {
    // Remove ipfs:// prefix if present
    const hash = ipfsHash.replace(/^ipfs:\/\//, '');
    return `${this.gateway}${hash}`;
  }

  /**
   * Upload to Pinata
   */
  private async uploadToPinata(data: string, filename: string): Promise<string | null> {
    const formData = new FormData();
    
    formData.append('file', Buffer.from(data), {
      filename,
      contentType: 'application/json',
    });

    formData.append('pinataMetadata', JSON.stringify({
      name: filename,
      keyvalues: {
        source: 'megabrain-protocol',
        timestamp: Date.now().toString(),
      },
    }));

    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false,
    }));

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${config.ipfs.pinata.jwt}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 60000,
        }
      );

      logger.info(`Uploaded to Pinata: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error) {
      logger.error('Pinata upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload file buffer to Pinata
   */
  private async uploadFileToPinata(
    buffer: Buffer, 
    filename: string, 
    contentType: string
  ): Promise<string | null> {
    const formData = new FormData();
    
    formData.append('file', buffer, {
      filename,
      contentType,
    });

    formData.append('pinataMetadata', JSON.stringify({
      name: filename,
      keyvalues: {
        source: 'megabrain-protocol',
        timestamp: Date.now().toString(),
      },
    }));

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${config.ipfs.pinata.jwt}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 60000,
        }
      );

      logger.info(`Uploaded file to Pinata: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error) {
      logger.error('Pinata file upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload to NFT.Storage
   */
  private async uploadToNFTStorage(data: string, filename: string): Promise<string | null> {
    const blob = new Blob([data], { type: 'application/json' });
    
    try {
      const response = await axios.post(
        'https://api.nft.storage/upload',
        blob,
        {
          headers: {
            'Authorization': `Bearer ${config.ipfs.nftStorage.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      logger.info(`Uploaded to NFT.Storage: ${response.data.value.cid}`);
      return response.data.value.cid;
    } catch (error) {
      logger.error('NFT.Storage upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload file buffer to NFT.Storage
   */
  private async uploadFileToNFTStorage(
    buffer: Buffer, 
    filename: string, 
    contentType: string
  ): Promise<string | null> {
    try {
      const response = await axios.post(
        'https://api.nft.storage/upload',
        buffer,
        {
          headers: {
            'Authorization': `Bearer ${config.ipfs.nftStorage.apiKey}`,
            'Content-Type': contentType,
          },
          timeout: 60000,
        }
      );

      logger.info(`Uploaded file to NFT.Storage: ${response.data.value.cid}`);
      return response.data.value.cid;
    } catch (error) {
      logger.error('NFT.Storage file upload failed:', error);
      throw error;
    }
  }

  /**
   * Unpin content from IPFS (Pinata only)
   */
  async unpin(hash: string): Promise<boolean> {
    if (!this.enabled || this.provider !== 'pinata') {
      return false;
    }

    try {
      await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${hash}`,
        {
          headers: {
            'Authorization': `Bearer ${config.ipfs.pinata.jwt}`,
          },
          timeout: 30000,
        }
      );

      logger.info(`Unpinned from Pinata: ${hash}`);
      return true;
    } catch (error) {
      logger.error(`Failed to unpin from Pinata (${hash}):`, error);
      return false;
    }
  }

  /**
   * Test IPFS connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const testData = { test: true, timestamp: Date.now() };
      const hash = await this.uploadJSON(testData, 'test.json');
      
      if (hash) {
        // Clean up test data
        await this.unpin(hash);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('IPFS connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const ipfsService = new IPFSService();
export default ipfsService;
