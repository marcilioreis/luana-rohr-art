ALTER TABLE "orders" ADD COLUMN "delivery_method" varchar(20) DEFAULT 'entrega' NOT NULL;--> statement-breakpoint
DROP VIEW IF EXISTS orders_enriched;--> statement-breakpoint
CREATE VIEW orders_enriched AS
SELECT
  o.id,
  o.order_number,
  o.customer_id,
  o.status,
  CASE o.status
    WHEN 'aguardando_pagamento' THEN 'Aguardando pagamento'
    WHEN 'pago' THEN 'Pago'
    WHEN 'enviado' THEN 'Enviado'
    WHEN 'entregue' THEN 'Entregue'
    WHEN 'cancelado' THEN 'Cancelado'
    ELSE o.status
  END AS status_label,
  o.delivery_method,
  o.subtotal,
  o.shipping_fee,
  o.total,
  o.pix_payload,
  o.pix_txid,
  o.customer_name,
  o.customer_email,
  o.customer_phone,
  o.shipping_address,
  o.notes,
  o.created_at,
  o.paid_at,
  o.shipped_at,
  o.delivered_at,
  o.cancelled_at,
  CAST(COALESCE((
    SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id
  ), 0) AS INTEGER) AS item_count,
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', oi.id,
      'productId', oi.product_id,
      'variantId', oi.variant_id,
      'productName', oi.product_name,
      'variantLabel', oi.variant_label,
      'unitPrice', oi.unit_price,
      'quantity', oi.quantity,
      'lineTotal', oi.line_total
    ) ORDER BY oi.id)
    FROM order_items oi WHERE oi.order_id = o.id
  ), '[]'::json) AS items
FROM orders o;
