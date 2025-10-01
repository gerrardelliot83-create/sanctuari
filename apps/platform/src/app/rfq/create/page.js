'use client';

/**
 * Page: Product Selection
 * Purpose: Let user choose insurance product to create RFQ
 * Route: /rfq/create
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@sanctuari/database/lib/client';
import { getUser } from '@sanctuari/database/lib/auth';
import Sidebar from '@sanctuari/ui/components/Sidebar/Sidebar';
import TopBar from '@sanctuari/ui/components/TopBar/TopBar';
import ProductCard from '@sanctuari/ui/components/ProductCard/ProductCard';
import CategoryFilter from '@sanctuari/ui/components/CategoryFilter/CategoryFilter';
import Input from '@sanctuari/ui/components/Input/Input';
import { signOut } from '@sanctuari/database/lib/auth';
import './page.css';

export default function ProductSelectionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Get current user
      const { user: currentUser } = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Get user's company
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (memberData) {
        setCurrentCompanyId(memberData.company_id);
      }

      // Load insurance products
      const response = await fetch('/api/insurance-products');
      const data = await response.json();

      if (data.products) {
        setProducts(data.products);
        setFilteredProducts(data.products);
      }

      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  // Filter products by category and search
  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [activeCategory, searchQuery, products]);

  const handleProductSelect = async (product) => {
    if (creating || !currentCompanyId) return;

    setCreating(true);

    try {
      // Create draft RFQ
      const response = await fetch('/api/rfq/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          company_id: currentCompanyId,
          user_id: user.id,
          title: `${product.name} RFQ`,
        }),
      });

      const data = await response.json();

      if (data.rfq) {
        // Redirect to policy upload page (Phase 5)
        router.push(`/rfq/${data.rfq.id}/upload`);
      } else {
        alert('Failed to create RFQ. Please try again.');
        setCreating(false);
      }
    } catch (error) {
      console.error('Error creating RFQ:', error);
      alert('An error occurred. Please try again.');
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="product-selection-loading">
        <div className="product-selection-loading__spinner" />
      </div>
    );
  }

  return (
    <>
      <Sidebar />

      <div className="dashboard-main-wrapper">
        <TopBar
          userName={user?.user_metadata?.full_name || user?.email}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />

        <div className="dashboard-content-wrapper">
          <div className="product-selection">
            <div className="product-selection__header">
              <div>
                <h1 className="product-selection__title">Create RFQ</h1>
                <p className="product-selection__subtitle">
                  Choose an insurance product to get started
                </p>
              </div>
            </div>

            <div className="product-selection__filters">
              <CategoryFilter
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />

              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="product-selection__search"
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="product-selection__empty">
                <p>No products found matching your criteria.</p>
              </div>
            ) : (
              <div className="product-selection__grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={handleProductSelect}
                  />
                ))}
              </div>
            )}

            {creating && (
              <div className="product-selection__creating">
                <div className="product-selection__creating-spinner" />
                <p>Creating your RFQ...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
