'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import RFQForm from '@/components/platform/RFQForm'
import Navigation from '@/components/platform/Navigation'
import { parseRFQCsv } from '@/utils/rfqParser'
import { ProductType } from '@/lib/supabase/types'
import toast from 'react-hot-toast'

const productCategories = [
  {
    name: 'Property Insurance',
    products: [
      { type: 'fire_special_perils', name: 'Fire & Special Perils', icon: '🔥' },
      { type: 'burglary', name: 'Burglary Insurance', icon: '🔒' },
      { type: 'business_interruption', name: 'Business Interruption', icon: '⚡' },
      { type: 'contractors_all_risk', name: "Contractors' All Risk", icon: '🏗️' },
      { type: 'erection_all_risk', name: 'Erection All Risk', icon: '⚙️' }
    ]
  },
  {
    name: 'Liability Insurance',
    products: [
      { type: 'public_liability', name: 'Public Liability', icon: '👥' },
      { type: 'product_liability', name: 'Product Liability', icon: '📦' },
      { type: 'professional_indemnity', name: 'Professional Indemnity', icon: '💼' },
      { type: 'directors_officers', name: 'Directors & Officers', icon: '👔' },
      { type: 'cyber_liability', name: 'Cyber Liability', icon: '🔐' }
    ]
  },
  {
    name: 'Employee Benefits',
    products: [
      { type: 'group_health', name: 'Group Health', icon: '🏥' },
      { type: 'group_personal_accident', name: 'Group Personal Accident', icon: '🚑' },
      { type: 'group_term_life', name: 'Group Term Life', icon: '❤️' },
      { type: 'workmen_compensation', name: "Workmen's Compensation", icon: '👷' }
    ]
  },
  {
    name: 'Marine & Cargo',
    products: [
      { type: 'marine_cargo', name: 'Marine Cargo', icon: '🚢' }
    ]
  }
]

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
            <span>🎉</span> Your first RFQ is FREE!
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
                  <span className="product-icon">{product.icon}</span>
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
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--spacing-2xl);
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
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-lg);
        }

        .product-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-xl);
          background: var(--color-white);
          border: 2px solid var(--color-gray-200);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s;
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
          font-size: 3rem;
        }

        .product-name {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-gray-900);
          text-align: center;
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