'use client'

import { forwardRef } from 'react'
import { Venta } from '@/lib/api'
import { formatGs, formatDate, metodoPagoLabel } from '@/lib/utils'

interface Props {
  venta: Venta
}

const ComprobanteImprimible = forwardRef<HTMLDivElement, Props>(({ venta }, ref) => {
  const nombreNegocio = process.env.NEXT_PUBLIC_NOMBRE_NEGOCIO ?? 'Distribuidora'
  const aliasPago = process.env.NEXT_PUBLIC_ALIAS_PAGO

  return (
    <div
      ref={ref}
      style={{
        fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
        padding: '32px',
        maxWidth: '620px',
        margin: '0 auto',
        color: '#1E293B',
        background: '#fff',
      }}
    >
      <style>{`
        @page { size: A4; margin: 18mm 20mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1D4ED8', paddingBottom: '18px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1E3A8A', margin: 0, letterSpacing: '-0.02em' }}>
          {nombreNegocio}
        </h1>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>Productos de Limpieza</p>
      </div>

      {/* Número y fecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Comprobante de Venta
          </p>
          <p style={{ fontSize: '22px', fontWeight: '700', color: '#3B82F6', margin: '4px 0 0', letterSpacing: '-0.01em' }}>
            {venta.numero_venta}
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <p style={{ color: '#94A3B8', margin: 0 }}>Fecha</p>
          <p style={{ fontWeight: '600', margin: '2px 0 8px', color: '#1E293B' }}>{formatDate(venta.created_at)}</p>
          <p style={{ color: '#94A3B8', margin: 0 }}>Estado</p>
          <p style={{
            display: 'inline-block',
            fontWeight: '600',
            margin: '2px 0 0',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            background: venta.estado === 'confirmado' ? '#DCFCE7' : venta.estado === 'cancelado' ? '#FEE2E2' : '#FEF9C3',
            color: venta.estado === 'confirmado' ? '#16A34A' : venta.estado === 'cancelado' ? '#DC2626' : '#CA8A04',
          }}>
            {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
          </p>
        </div>
      </div>

      {/* Datos del cliente */}
      <div style={{ background: '#F0F4FF', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px' }}>
        <p style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
          Datos del Cliente
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
          <div>
            <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>Nombre</p>
            <p style={{ fontSize: '14px', fontWeight: '600', margin: '2px 0 0', color: '#1E293B' }}>{venta.cliente_nombre}</p>
          </div>
          {venta.cliente_telefono && (
            <div>
              <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>Teléfono</p>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '2px 0 0', color: '#1E293B' }}>{venta.cliente_telefono}</p>
            </div>
          )}
          <div>
            <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>Método de Pago</p>
            <p style={{ fontSize: '14px', fontWeight: '600', margin: '2px 0 0', color: '#1E293B' }}>{metodoPagoLabel(venta.metodo_pago)}</p>
          </div>
          {(venta.metodo_pago === 'alias' || venta.metodo_pago === 'transferencia') && aliasPago && (
            <div>
              <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>Alias / Número</p>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '2px 0 0', color: '#1D4ED8' }}>{aliasPago}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de productos */}
      <p style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
        Productos
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
        <thead>
          <tr style={{ background: '#EFF6FF', borderBottom: '2px solid #BFDBFE' }}>
            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: '700', color: '#1E3A8A', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Producto
            </th>
            <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: '700', color: '#1E3A8A', fontSize: '11px', textTransform: 'uppercase' }}>
              Cant.
            </th>
            <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: '700', color: '#1E3A8A', fontSize: '11px', textTransform: 'uppercase' }}>
              P. Unit.
            </th>
            <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: '700', color: '#1E3A8A', fontSize: '11px', textTransform: 'uppercase' }}>
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {venta.items.map((item, idx) => (
            <tr
              key={item.id}
              style={{
                borderBottom: '1px solid #E2E8F8',
                background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFF',
              }}
            >
              <td style={{ padding: '9px 10px', color: '#1E293B' }}>{item.producto_nombre}</td>
              <td style={{ padding: '9px 10px', textAlign: 'center', color: '#64748B' }}>{item.cantidad}</td>
              <td style={{ padding: '9px 10px', textAlign: 'right', color: '#64748B', whiteSpace: 'nowrap' }}>
                {formatGs(item.precio_unitario)}
              </td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap' }}>
                {formatGs(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div style={{ marginLeft: 'auto', maxWidth: '240px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px', color: '#64748B' }}>
          <span>Subtotal</span>
          <span style={{ color: '#1E293B', fontWeight: '500' }}>{formatGs(venta.subtotal)}</span>
        </div>
        {Number(venta.descuento) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px', color: '#64748B' }}>
            <span>Descuento</span>
            <span style={{ color: '#DC2626', fontWeight: '500' }}>- {formatGs(venta.descuento)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 6px', borderTop: '2px solid #1D4ED8', marginTop: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</span>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#1E3A8A' }}>{formatGs(venta.total)}</span>
        </div>
      </div>

      {/* Notas */}
      {venta.notas && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '10px 14px', marginBottom: '18px', fontSize: '12px' }}>
          <span style={{ fontWeight: '700', color: '#92400E' }}>Notas: </span>
          <span style={{ color: '#78350F' }}>{venta.notas}</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '1px solid #E2E8F8', paddingTop: '16px', marginTop: '8px' }}>
        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E3A8A', margin: 0 }}>¡Gracias por su compra!</p>
        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
          Este comprobante es válido como constancia de su pedido.
        </p>
      </div>
    </div>
  )
})

ComprobanteImprimible.displayName = 'ComprobanteImprimible'

export default ComprobanteImprimible
