import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Product } from '@/types/product';
const ProductList: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('none');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://fakestoreapi.com/products');
      const data = await response.json();
      setAllProducts(data);
      updateDisplayedProducts(data, 'all', sortBy, 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://fakestoreapi.com/products/categories');
      const data = await response.json();
      setCategories(['all', ...data]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchAllProducts();
    fetchCategories();
  }, []);

  const updateDisplayedProducts = useCallback((
    products: Product[],
    category: string,
    sort: string,
    currentPage: number
  ) => {
    let filtered = [...products];

    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter(item => item.category === category);
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    // Apply pagination
    setDisplayedProducts(filtered.slice(0, currentPage * 5));
  }, []);

  useEffect(() => {
    updateDisplayedProducts(allProducts, selectedCategory, sortBy, page);
  }, [selectedCategory, sortBy, page, allProducts, updateDisplayedProducts]);

  const handleLoadMore = () => {
    if (!loading && displayedProducts.length < allProducts.length) {
      setPage(prev => prev + 1);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1); // Reset pagination when changing category
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderCategoryChip = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryChip,
        selectedCategory === category && styles.selectedCategoryChip,
      ]}
      onPress={() => handleCategoryChange(category)}
    >
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === category && styles.selectedCategoryChipText,
        ]}
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <TouchableOpacity onPress={() => toggleExpand(item.id)}>
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          resizeMode='contain'
        />
        <Text style={styles.productTitle}>{item.title}</Text>
        <Text style={styles.price}>$ {item.price}</Text>
      </TouchableOpacity>

      {expandedId === item.id && (
        <View style={styles.expandedContent}>
          <Text style={styles.price}>$ {item.price}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.category}>Category: {item.category}</Text>
          <Text style={styles.rating}>
            Rating: {item.rating.rate} ({item.rating.count} reviews)
          </Text>
          <TouchableOpacity
            onPress={() => toggleExpand(item.id)}
            style={styles.collapseButton}
          >
            <Text style={styles.collapseButtonText}>-</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollView}
        >
          {categories.map(renderCategoryChip)}
        </ScrollView>
      </View>

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortBy(sortBy === 'price_asc' ? 'price_desc' : 'price_asc')}
        >
          <Text style={styles.sortButtonText}>
            Price {sortBy === 'price_asc' ? '↑' : '↓'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && displayedProducts.length === 0 ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#2ecc71" />
        </View>
      ) : (
        <FlatList
          data={displayedProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          onEndReached={handleLoadMore}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() =>
            loading ? <ActivityIndicator size="large" color="#2ecc71" /> : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios'? 0 : StatusBar.currentHeight,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriesScrollView: {
    paddingHorizontal: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  selectedCategoryChip: {
    backgroundColor: '#2ecc71',
    borderColor: '#27ae60',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  sortContainer: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  productCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  collapseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductList;