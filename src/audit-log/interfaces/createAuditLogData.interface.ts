export interface CreateAuditLogData {
    tableName: string;
    recordId: string;
    action: string;
    userId: string;
    newValues: any;
    ipAddress: string;
    userAgent: string;
}