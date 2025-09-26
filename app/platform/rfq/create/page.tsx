'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import RFQForm from '@/components/platform/RFQForm'
import Navigation from '@/components/platform/Navigation'
import { parseRFQCsv } from '@/utils/rfqParser'
import { ProductType } from '@/lib/supabase/types'
import { productCategories } from '@/data/products'
import toast from 'react-hot-toast'

export default function CreateRFQPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null)
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [freeRFQUsed, setFreeRFQUsed] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkFreeRFQStatus()
  }, [user])

  const checkFreeRFQStatus = async () => {
    if (!user) return

    const { count } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    setFreeRFQUsed((count || 0) > 0)
  }

  const loadTemplate = async (productType: ProductType) => {
    setLoading(true)
    try {
      // First try to load from database
      const { data: dbTemplate } = await supabase
        .from('rfq_templates')
        .select('*')
        .eq('product_type', productType)
        .eq('is_active', true)
        .single()

      if (dbTemplate) {
        setTemplate({
          productType: (dbTemplate as any).product_type,
          name: (dbTemplate as any).name,
          description: (dbTemplate as any).description,
          fields: (dbTemplate as any).fields,
          sections: [...new Set((dbTemplate as any).fields.map((f: any) => f.section))],
          guidanceContent: (dbTemplate as any).guidance_content
        })
      } else {
        // Fallback: Load from CSV (for development)
        // This would be replaced with proper template loading in production
        toast.error('Template not found. Please contact support.')
      }
    } catch (error) {
      toast.error('Failed to load template')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = async (productType: ProductType) => {
    // Check if user needs to pay
    if (freeRFQUsed) {
      const confirmed = await showPaymentModal()
      if (!confirmed) return
    }

    setSelectedProduct(productType)
    await loadTemplate(productType)
  }

  const showPaymentModal = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const modal = document.createElement('div')
      modal.className = 'payment-modal'
      modal.innerHTML = `
        <div class="modal-content">
          <h2>Payment Required</h2>
          <p>Your first RFQ was free. Subsequent RFQs require a fee of ₹1,599 per placement.</p>
          <div class="modal-actions">
            <button class="btn-secondary" id="cancel-btn">Cancel</button>
            <button class="btn-primary" id="pay-btn">Pay ₹1,599</button>
          </div>
        </div>
      `
      document.body.appendChild(modal)

      const cancelBtn = document.getElementById('cancel-btn')
      const payBtn = document.getElementById('pay-btn')

      cancelBtn?.addEventListener('click', () => {
        document.body.removeChild(modal)
        resolve(false)
      })

      payBtn?.addEventListener('click', async () => {
        document.body.removeChild(modal)
        // Initiate Razorpay payment
        await initiatePayment()
        resolve(true)
      })
    })
  }

  const initiatePayment = async () => {
    // This will be implemented when integrating Razorpay
    toast.success('Payment integration coming soon!')
  }

  const handleRFQSubmit = async (formData: any) => {
    try {
      const { data: rfq, error } = await supabase
        .from('rfqs')
        .insert({
          user_id: user?.id,
          product_type: selectedProduct,
          form_data: formData,
          status: 'draft',
          is_paid: !freeRFQUsed || false
        } as any)
        .select()
        .single()

      if (error) throw error

      toast.success('RFQ created successfully!')
      router.push(`/platform/rfq/${(rfq as any).id}/distribute`)
    } catch (error) {
      toast.error('Failed to create RFQ')
      console.error(error)
    }
  }

  if (template && selectedProduct) {
    return (
      <>
        <Navigation />
        <div className="create-rfq-container">
        <button
          onClick={() => {
            setTemplate(null)
            setSelectedProduct(null)
          }}
          className="back-button"
        >
          ← Back to Product Selection
        </button>
        <RFQForm template={template} onSubmit={handleRFQSubmit} />
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="create-rfq-container">
      <div className="page-header">
        <h1>Create New RFQ</h1>
        <p>Select an insurance product to get started with your request for quote</p>
        {!freeRFQUsed && (
          <div className="free-badge">
            Your first RFQ is FREE!
          </div>
        )}
      </div>

      <div className="product-categories">
        {productCategories.map((category) => (
          <div key={category.name} className="category-section">
            <h2>{category.name}</h2>
            <div className="product-grid">
              {category.products.map((product) => (
                <button
                  key={product.type}
                  className="product-card"
                  onClick={() => handleProductSelect(product.type as ProductType)}
                  disabled={loading}
                >
                  <span className={`product-icon icon-${product.icon}`}></span>
                  <span className="product-name">{product.name}</span>
                  {freeRFQUsed && (
                    <span className="product-price">₹1,599</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="info-section">
        <h3>How It Works</h3>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h4>Fill RFQ Form</h4>
            <p>Complete a simple form with your insurance requirements</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h4>Distribute to Market</h4>
            <p>Send your RFQ to multiple insurers and brokers</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h4>Receive Quotes</h4>
            <p>Get competitive quotes from the market</p>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <h4>Compare & Choose</h4>
            <p>Use our AI-powered comparison to select the best quote</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .create-rfq-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--spacing-2xl) var(--spacing-xl);
        }

        .page-header {
          text-align: center;
          margin-bottom: var(--spacing-3xl);
        }

        .page-header h1 {
          font-size: var(--font-size-3xl);
          margin-bottom: var(--spacing-md);
        }

        .page-header p {
          font-size: var(--font-size-lg);
          color: var(--color-gray-600);
        }

        .free-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: var(--color-success);
          color: var(--color-white);
          padding: var(--spacing-sm) var(--spacing-lg);
          border-radius: var(--radius-full);
          margin-top: var(--spacing-lg);
          font-weight: 600;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--color-primary);
          font-size: var(--font-size-base);
          margin-bottom: var(--spacing-xl);
          background: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .back-button:hover {
          transform: translateX(-4px);
        }

        .product-categories {
          margin-bottom: var(--spacing-3xl);
        }

        .category-section {
          margin-bottom: var(--spacing-2xl);
        }

        .category-section h2 {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-lg);
          color: var(--color-gray-700);
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: var(--spacing-md);
        }

        .product-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-sm);
          background: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
          min-height: 120px;
          justify-content: center;
        }

        .product-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .product-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .product-icon {
          width: 36px;
          height: 36px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-icon::before {
          content: '';
          width: 24px;
          height: 24px;
          background-color: var(--color-primary);
          mask-size: contain;
          mask-repeat: no-repeat;
          mask-position: center;
        }

        .icon-shield::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'/%3E%3C/svg%3E");
        }

        .icon-lock::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/%3E%3C/svg%3E");
        }

        .icon-trending::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'/%3E%3C/svg%3E");
        }

        .icon-tools::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'/%3E%3C/svg%3E");
        }

        .icon-cog::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'/%3E%3C/svg%3E");
        }

        .icon-users::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'/%3E%3C/svg%3E");
        }

        .icon-package::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'/%3E%3C/svg%3E");
        }

        .icon-briefcase::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0l4 6-4 6H8l-4-6 4-6h8z'/%3E%3C/svg%3E");
        }

        .icon-user-tie::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/%3E%3C/svg%3E");
        }

        .icon-shield-check::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'/%3E%3C/svg%3E");
        }

        .icon-heart::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'/%3E%3C/svg%3E");
        }

        .icon-medical::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'/%3E%3C/svg%3E");
        }

        .icon-life::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'/%3E%3C/svg%3E");
        }

        .icon-hard-hat::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'/%3E%3C/svg%3E");
        }

        .icon-ship::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'/%3E%3C/svg%3E");
        }

        /* Additional icons for new products */
        .icon-factory::before,
        .icon-shop::before,
        .icon-crane::before,
        .icon-boiler::before,
        .icon-wrench::before,
        .icon-gear::before,
        .icon-chip::before,
        .icon-clock::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'/%3E%3C/svg%3E");
        }

        .icon-currency::before,
        .icon-glass::before,
        .icon-sign::before,
        .icon-code::before,
        .icon-leaf::before,
        .icon-truck::before,
        .icon-badge::before,
        .icon-container::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'/%3E%3C/svg%3E");
        }

        .icon-route::before,
        .icon-anchor::before,
        .icon-box::before,
        .icon-luggage::before,
        .icon-store::before,
        .icon-credit::before,
        .icon-handshake::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'/%3E%3C/svg%3E");
        }

        .icon-document::before,
        .icon-chart::before,
        .icon-stop::before,
        .icon-cow::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'/%3E%3C/svg%3E");
        }

        .product-name {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-gray-900);
          text-align: center;
          line-height: 1.2;
        }

        .product-price {
          font-size: var(--font-size-sm);
          color: var(--color-primary);
          font-weight: 500;
        }

        .info-section {
          background: var(--color-gray-50);
          border-radius: var(--radius-lg);
          padding: var(--spacing-2xl);
        }

        .info-section h3 {
          font-size: var(--font-size-2xl);
          margin-bottom: var(--spacing-xl);
          text-align: center;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-xl);
        }

        .step {
          text-align: center;
        }

        .step-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: var(--color-primary);
          color: var(--color-white);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xl);
          font-weight: 700;
          margin-bottom: var(--spacing-md);
        }

        .step h4 {
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-sm);
        }

        .step p {
          color: var(--color-gray-600);
          font-size: var(--font-size-sm);
        }

        :global(.payment-modal) {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        :global(.modal-content) {
          background: var(--color-white);
          border-radius: var(--radius-lg);
          padding: var(--spacing-2xl);
          max-width: 400px;
          width: 90%;
        }

        :global(.modal-content h2) {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-lg);
        }

        :global(.modal-content p) {
          color: var(--color-gray-600);
          margin-bottom: var(--spacing-xl);
        }

        :global(.modal-actions) {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .create-rfq-container {
            padding: var(--spacing-lg);
          }

          .product-grid {
            grid-template-columns: 1fr;
          }

          .steps {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      </div>
    </>
  )
}