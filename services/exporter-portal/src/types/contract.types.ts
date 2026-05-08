/**
 * Sales Contract Workflow Type Definitions
 */

/**
 * Contract Status enum
 */
export enum ContractStatus {
  DRAFT = 'DRAFT',
  COUNTERED = 'COUNTERED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  FINALIZED = 'FINALIZED',
}

/**
 * Contract History Action enum
 */
export enum ContractHistoryAction {
  CREATED = 'CREATED',
  MODIFIED = 'MODIFIED',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTERED = 'COUNTERED',
  FINALIZED = 'FINALIZED',
}

/**
 * Actor Type enum
 */
export enum ActorType {
  EXPORTER = 'EXPORTER',
  BUYER = 'BUYER',
  SYSTEM = 'SYSTEM',
}

/**
 * Notification Type enum
 */
export enum NotificationType {
  CONTRACT_SENT = 'CONTRACT_SENT',
  CONTRACT_ACCEPTED = 'CONTRACT_ACCEPTED',
  CONTRACT_REJECTED = 'CONTRACT_REJECTED',
  CONTRACT_COUNTERED = 'CONTRACT_COUNTERED',
  COUNTER_ACCEPTED = 'COUNTER_ACCEPTED',
  CONTRACT_FINALIZED = 'CONTRACT_FINALIZED',
  ECTA_REGISTERED = 'ECTA_REGISTERED',
  CERTIFICATE_READY = 'CERTIFICATE_READY',
}

/**
 * Permission Type enum
 */
export enum PermissionType {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  RESPOND = 'RESPOND',
  FINALIZE = 'FINALIZE',
  ADMIN = 'ADMIN',
}

/**
 * Payment Terms enum
 */
export enum PaymentTerms {
  ADVANCE_PAYMENT = 'Advance Payment',
  LETTER_OF_CREDIT = 'Letter of Credit',
  CASH_ON_DELIVERY = 'Cash on Delivery',
  NET_30 = 'Net 30',
  NET_60 = 'Net 60',
  NET_90 = 'Net 90',
}

/**
 * Contract Draft interface
 */
export interface ContractDraft {
  draft_id: string;
  exporter_id: string;
  buyer_id?: string;
  buyer_email: string;
  buyer_name: string;
  coffee_type: string;
  quantity_bags: number;
  unit_price: number;
  currency: string;
  payment_terms: string;
  delivery_location: string;
  delivery_date: Date;
  lc_number?: string;
  ecta_reference_number?: string;
  status: ContractStatus;
  blockchain_tx_hash?: string;
  created_at: Date;
  last_modified_at: Date;
  finalized_at?: Date;
}

/**
 * Contract History interface
 */
export interface ContractHistory {
  history_id: string;
  draft_id: string;
  version_number: number;
  status: ContractStatus;
  actor_type: ActorType;
  actor_id: string;
  action: ContractHistoryAction;
  changes?: Record<string, any>;
  rejection_reason?: string;
  created_at: Date;
}

/**
 * Contract Notification interface
 */
export interface ContractNotification {
  notification_id: string;
  draft_id: string;
  recipient_id: string;
  recipient_email: string;
  notification_type: NotificationType;
  subject: string;
  message: string;
  action_link?: string;
  is_read: boolean;
  sent_at: Date;
  read_at?: Date;
}

/**
 * Contract Permission interface
 */
export interface ContractPermission {
  permission_id: string;
  draft_id: string;
  user_id: string;
  user_email?: string;
  permission_type: PermissionType;
  granted_at: Date;
  expires_at?: Date;
}

/**
 * Create Contract Draft Request
 */
export interface CreateContractDraftRequest {
  buyer_name: string;
  buyer_email: string;
  coffee_type: string;
  quantity_bags: number;
  unit_price: number;
  currency: string;
  payment_terms: string;
  delivery_location: string;
  delivery_date: Date;
}

/**
 * Update Contract Draft Request
 */
export interface UpdateContractDraftRequest {
  buyer_email?: string;
  buyer_name?: string;
  coffee_type?: string;
  quantity_bags?: number;
  unit_price?: number;
  currency?: string;
  payment_terms?: string;
  delivery_location?: string;
  delivery_date?: Date;
}

/**
 * Buyer Response Request
 */
export interface BuyerResponseRequest {
  action: 'ACCEPT' | 'REJECT' | 'COUNTER';
  reason?: string;
  modifications?: Record<string, any>;
}

/**
 * Counter Offer Request
 */
export interface CounterOfferRequest {
  modifications: Record<string, any>;
}

/**
 * Contract Comparison interface
 */
export interface ContractComparison {
  original: ContractDraft;
  modified: ContractDraft;
  changes: Record<string, { original: any; modified: any }>;
}

/**
 * Validation Error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validation Result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
