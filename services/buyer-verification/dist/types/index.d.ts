import { Pool } from 'pg';
export interface Buyer {
    buyer_id: string;
    company_name: string;
    country: string;
    registration_number: string;
    industry: string;
    address?: string;
    verification_status?: string;
    sanctions_check_status?: string;
}
export interface VerificationRecord {
    buyer_id: string;
    verification_type: string;
    provider: string;
    status: string;
    score?: number;
    details?: Record<string, unknown>;
    raw_response?: Record<string, unknown>;
    created_at?: Date;
}
export interface RiskComponent {
    score: number;
    level: RiskLevel;
    reason: string;
    [key: string]: unknown;
}
export interface RiskComponents {
    credit: RiskComponent;
    compliance: RiskComponent;
    transaction: RiskComponent;
    geographic: RiskComponent;
    industry: RiskComponent;
}
export interface RiskScoreResult {
    buyerId: string;
    overallScore: number;
    riskLevel: RiskLevel;
    components: RiskComponents;
    weights: Record<string, number>;
    calculatedAt: string;
    recommendations: string[];
}
export interface VerificationResult {
    status: 'PASSED' | 'FAILED' | 'ERROR' | 'PENDING';
    provider: string;
    score?: number;
    rating?: string;
    details?: Record<string, unknown>;
    matches?: unknown[];
    lists?: string[];
    companyDetails?: Record<string, unknown>;
    error?: string;
}
export interface VerificationResults {
    creditCheck?: VerificationResult;
    sanctionsCheck?: VerificationResult;
    companyRegistry?: VerificationResult;
}
export type VerificationType = 'FULL' | 'CREDIT_CHECK' | 'SANCTIONS_SCREENING' | 'COMPANY_REGISTRY';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type VerificationStatus = 'VERIFIED' | 'REJECTED' | 'PENDING';
export interface DbPool extends Pool {
}
//# sourceMappingURL=index.d.ts.map