/**
 * Payment flow and key exchange for paid content.
 *
 * Handles the transaction lifecycle for paid torrents:
 * 1. Buyer discovers paid content via manifest
 * 2. Buyer initiates payment via supported method
 * 3. Seller verifies payment and releases content key
 * 4. Buyer decrypts content blocks using the released key
 *
 * Phase 2+: Replace stubs with real payment provider integrations.
 */

import type { DatabaseAdapter } from '@mylife/db';
import type { ContentManifest, TorrentPaymentDirection, TorrentPaymentStatus } from '../types';

export interface PaymentRecord {
  id: string;
  infoHash: string;
  buyerPublicKey: string;
  sellerPublicKey: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  direction: TorrentPaymentDirection;
  status: TorrentPaymentStatus;
  transactionRef: string | null;
  contentKeyEncrypted: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface PaymentRequest {
  manifest: ContentManifest;
  buyerPublicKey: string;
  paymentMethod: string;
}

export interface PaymentVerification {
  infoHash: string;
  transactionRef: string;
  buyerPublicKey: string;
}

/**
 * Manages payment flows for paid content.
 *
 * Phase 2+: Integrate with actual payment providers (Stripe, crypto, etc.)
 */
export class PaidContentManager {
  private readonly _db: DatabaseAdapter;
  private _payments: Map<string, PaymentRecord> = new Map();

  constructor(db: DatabaseAdapter) {
    this._db = db;
  }

  /**
   * Initiate a purchase for paid content.
   * Returns a payment ID for tracking.
   */
  async initiatePurchase(request: PaymentRequest): Promise<string> {
    if (request.manifest.access !== 'paid') {
      throw new Error('Content is not paid');
    }
    if (!request.manifest.price) {
      throw new Error('Paid content has no price set');
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const record: PaymentRecord = {
      id: paymentId,
      infoHash: request.manifest.infoHash,
      buyerPublicKey: request.buyerPublicKey,
      sellerPublicKey: request.manifest.creator.publicKey,
      amount: request.manifest.price.amount,
      currency: request.manifest.price.currency,
      paymentMethod: request.paymentMethod,
      direction: 'outgoing',
      status: 'pending',
      transactionRef: null,
      contentKeyEncrypted: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this._payments.set(paymentId, record);

    // Phase 2: Submit payment to provider and get transaction ref
    this._db.execute(
      `INSERT INTO torrent_payments (id, info_hash, buyer_public_key, seller_public_key,
        amount, currency, payment_method, direction, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id, record.infoHash, record.buyerPublicKey, record.sellerPublicKey,
        record.amount, record.currency, record.paymentMethod,
        record.direction, record.status, record.createdAt,
      ],
    );

    return paymentId;
  }

  /**
   * Verify a payment and release the content decryption key.
   * Called by the seller after confirming payment was received.
   */
  async verifyAndReleaseKey(
    verification: PaymentVerification,
    contentKey: string,
  ): Promise<void> {
    // Phase 2: Verify payment with provider, encrypt content key for buyer
    void verification;
    void contentKey;
  }

  /**
   * Complete a purchase after key is received.
   * Returns the decrypted content key.
   */
  async completePurchase(paymentId: string, encryptedKey: string): Promise<string> {
    const record = this._payments.get(paymentId);
    if (!record) throw new Error(`Payment ${paymentId} not found`);

    record.status = 'completed';
    record.contentKeyEncrypted = encryptedKey;
    record.completedAt = new Date().toISOString();

    this._db.execute(
      `UPDATE torrent_payments SET status = ?, completed_at = ? WHERE id = ?`,
      ['completed', record.completedAt, paymentId],
    );

    // Phase 2: Decrypt the content key using buyer's private key
    return encryptedKey;
  }

  /** Get a payment record by ID. */
  getPayment(paymentId: string): PaymentRecord | undefined {
    return this._payments.get(paymentId);
  }

  /** Get all payments for a specific torrent. */
  getPaymentsForTorrent(infoHash: string): PaymentRecord[] {
    return Array.from(this._payments.values()).filter(
      (p) => p.infoHash === infoHash,
    );
  }

  /** Request a refund for a payment. */
  async requestRefund(paymentId: string): Promise<void> {
    const record = this._payments.get(paymentId);
    if (!record) throw new Error(`Payment ${paymentId} not found`);
    if (record.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }

    record.status = 'refunded';

    this._db.execute(
      `UPDATE torrent_payments SET status = ? WHERE id = ?`,
      ['refunded', paymentId],
    );
  }

  /** Check if the user has purchased a specific torrent. */
  hasPurchased(infoHash: string): boolean {
    return Array.from(this._payments.values()).some(
      (p) => p.infoHash === infoHash && p.status === 'completed',
    );
  }
}
