export declare function generateRequestId(): string;
export declare function storeRequestMetadata(requestId: string, metadata: {
    timestamp: string;
    url: string;
    method?: string;
    params?: Record<string, any>;
    data?: any;
    prompt?: string;
    sessionId?: string;
}): Promise<void>;
export declare function getRequestMetadata(requestId: string): Promise<any>;
export declare function storeResponseData(requestId: string, data: any, maxChunkSize?: number): Promise<{
    type: string;
    size: number;
    chunks: number;
    resourceUri: string;
    totalChunks?: undefined;
    resourceUris?: undefined;
} | {
    type: string;
    totalChunks: number;
    size: number;
    resourceUris: string[];
    chunks?: undefined;
    resourceUri?: undefined;
}>;
export declare function getResponseData(requestId: string, chunkId?: string): Promise<any>;
export declare function listDataFiles(requestId: string): Promise<string[]>;
export declare function storeAnalysis(requestId: string, analysis: any): Promise<void>;
export declare function getAnalysis(requestId: string): Promise<any>;
export declare function listAllRequests(): Promise<any[]>;
export declare function listRequestsBySession(sessionId: string): Promise<any[]>;
export declare function deleteRequest(requestId: string): Promise<boolean>;
export declare function requestExists(requestId: string): Promise<boolean>;
export declare function getRequestStats(requestId: string): Promise<{
    requestId: string;
    timestamp: any;
    prompt: any;
    sessionId: any;
    dataType: string;
    dataFiles: number;
    totalSize: number;
    hasAnalysis: boolean;
    resourceUris: string[];
}>;
export declare function cleanupExpiredData(forceCleanAll?: boolean, maxAgeHours?: number): Promise<number>;
export declare function getDataStoreStats(): Promise<{
    totalRequests: number;
    totalSize: number;
    totalSizeMB: string;
    oldestRequest: {
        id: string;
        timestamp: string;
    } | null;
    newestRequest: {
        id: string;
        timestamp: string;
    } | null;
    storageRoot: string;
}>;
