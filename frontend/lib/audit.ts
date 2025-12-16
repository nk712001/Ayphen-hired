import { prisma } from "@/lib/prisma";

export type AuditAction =
    | "CREATE_COMPANY"
    | "UPDATE_COMPANY"
    | "DELETE_COMPANY"
    | "CREATE_USER"
    | "UPDATE_USER"
    | "DELETE_USER"
    | "CREATE_ORGANIZATION"
    | "UPDATE_ORGANIZATION"
    | "ASSIGN_RECRUITER"
    | "REMOVE_RECRUITER"
    | "CREATE_TEST"
    | "CREATE_CANDIDATE"
    | "ASSIGN_TEST";

export type AuditEntityType =
    | "Company"
    | "User"
    | "Organization"
    | "Test"
    | "Candidate"
    | "RecruiterOrganization";

interface CreateAuditLogParams {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string;
    userId: string;
    companyId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

export async function createAuditLog({
    action,
    entityType,
    entityId,
    userId,
    companyId,
    metadata,
    ipAddress,
    userAgent,
}: CreateAuditLogParams) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entityType,
                entityId,
                userId,
                companyId,
                metadata: metadata ? JSON.stringify(metadata) : null,
                ipAddress,
                userAgent,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // Silent fail to not block the main action, but log the error
    }
}
