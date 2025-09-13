import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { IP } from "../Config/config";

const KnowledgeHome = () => {
  const navigation = useNavigation();
  const searchInputRef = useRef(null); // Add ref for search input
  const [articlesData, setArticlesData] = useState([]);
  const [comments, setComments] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState(""); // New state for input text
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [articleViews, setArticleViews] = useState({});
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(["All"]);

  // Function to handle back navigation to ContactScreen
  const handleBackPress = () => {
    navigation.navigate("ContactScreen");
  };

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return "??";
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  // Function to get profile color based on index - strictly alternating between two colors
  const getProfileColor = (index) => {
    return index % 2 === 0 ? "#34e3b0" : "#2563eb";
  };

  // Function to render profile with initials
  const renderProfileImage = (authorName, index) => {
    const initials = getInitials(authorName);
    const backgroundColor = getProfileColor(index);

    return (
      <View style={[styles.authorImageInitials, { backgroundColor }]}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
    );
  };

  // Fetch articles from API
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${IP}/api/auth/kbarticles`);
      const data = await response.json();

      if (data.articles) {
        // Transform API data to match our component structure
        const transformedArticles = data.articles.map((article, index) => ({
          id: article.id,
          title: article.title,
          content: article.content,
          category: article.category,
          rating: parseFloat(article.rating) || 0,
          author: {
            name: article.author_name,
            designation: "Author",
          },
          totalRatings: Math.floor(Math.random() * 200) + 50, // Random for now since API doesn't provide
          views: parseInt(article.views) || 0,
        }));

        setArticlesData(transformedArticles);
        setFilteredArticles(transformedArticles);

        // Set up views tracking
        const viewsObj = {};
        transformedArticles.forEach((article) => {
          viewsObj[article.id] = article.views;
        });
        setArticleViews(viewsObj);

        // Extract unique categories
        const uniqueCategories = [
          "All",
          ...new Set(transformedArticles.map((article) => article.category)),
        ];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      Alert.alert("Error", "Failed to load articles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handlePostComment = (articleId) => {
    if (!comments[articleId]?.trim()) return;
    Alert.alert("Comment Posted", `Comment posted: ${comments[articleId]}`);
    setComments((prev) => ({ ...prev, [articleId]: "" }));
    // Here you can add API call to submit comment
  };

  const handleRating = (articleId, rating) => {
    setUserRatings((prev) => ({ ...prev, [articleId]: rating }));
    Alert.alert("Rating Submitted", `You rated this article ${rating} stars!`);
    // Here you can add API call to submit rating
  };

  const filterArticles = (searchText, category) => {
    let filtered = articlesData;

    if (category !== "All") {
      filtered = filtered.filter((article) => article.category === category);
    }

    if (searchText.trim() !== "") {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchText.toLowerCase()) ||
          article.content.toLowerCase().includes(searchText.toLowerCase()) ||
          article.category.toLowerCase().includes(searchText.toLowerCase()) ||
          article.author.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  };

  // Updated search handler - now only searches when search button is clicked
  const handleSearch = () => {
    setSearchQuery(searchInput);
    filterArticles(searchInput, selectedCategory);
    // Dismiss keyboard after search
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Clear search function
  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    filterArticles("", selectedCategory);
    // Dismiss keyboard when clearing
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setShowCategoryFilter(false);
    filterArticles(searchQuery, category);
  };

  const renderStars = (rating, isInteractive = false, articleId = null) => {
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.ceil(rating);
      const isHalf = i === Math.ceil(rating) && rating % 1 !== 0;

      stars.push(
        <TouchableOpacity
          key={`star-${i}`}
          onPress={isInteractive ? () => handleRating(articleId, i) : null}
          disabled={!isInteractive}
          style={isInteractive ? styles.interactiveStar : null}
        >
          <FontAwesome
            name={isHalf ? "star-half-o" : isFilled ? "star" : "star-o"}
            size={isInteractive ? 20 : 16}
            color="#FFD700"
          />
        </TouchableOpacity>
      );
    }

    return stars;
  };

  const renderFeatureCards = () => {
    const features = [
      {
        icon: "refresh",
        title: "Refresh",
        description: "Reload articles",
        color: "#8B5CF6", // Purple
        onPress: fetchArticles,
      },
      {
        icon: "star",
        title: "Rate",
        description: "Rate articles",
        color: "#F59E0B", // Amber
      },
      {
        icon: "eye",
        title: "Browse",
        description: "View content",
        color: "#10B981", // Emerald
      },
      {
        icon: "search",
        title: "Search",
        description: "Find articles",
        color: "#EF4444", // Red
       onPress: () => {
  if (searchInputRef.current) {
    searchInputRef.current.focus();
  }
},
      },
    ];

    return (
      <View style={styles.featureCardsContainer}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.featureCard, { backgroundColor: feature.color }]}
            onPress={feature.onPress}
            activeOpacity={0.8}
          >
            <View style={styles.featureIconContainer}>
              <FontAwesome name={feature.icon} size={28} color="#fff" />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderArticle = ({ item, index }) => {
    const articleNumber = index + 1;
    const borderLeftColor = index % 2 === 0 ? "#34e3b0" : "#2563eb";
    const accentColor = index % 2 === 0 ? "#34e3b0" : "#2563eb";

    return (
      <View style={[styles.articleContainer, { borderLeftColor }]}>
        <View style={styles.articleHeader}>
          <Text style={styles.articleNumber}>Article :{item.id}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(item.rating)}
            </View>
            <Text style={styles.ratingText}>
              {item.rating > 0 ? `${item.rating} (${item.totalRatings})` : " "}
            </Text>
          </View>
        </View>

        <View style={styles.authorContainer}>
          {renderProfileImage(item.author.name, index)}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.author.name}</Text>
            <Text style={styles.authorDesignation}>
              {item.author.designation}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.categoryContainer}>
          <View
            style={[styles.categoryBadge, { backgroundColor: accentColor }]}
          >
            <FontAwesome name="tag" size={12} color="#fff" />
            <Text style={styles.category}>{item.category}</Text>
          </View>
        </View>

        <Text style={styles.content}>{item.content}</Text>

        <View style={styles.userRatingSection}>
          <Text style={styles.rateLabel}>Rate this article:</Text>
          <View style={styles.userStarsContainer}>
            {renderStars(userRatings[item.id] || 0, true, item.id)}
          </View>
          {userRatings[item.id] && (
            <Text style={styles.userRatingText}>
              You rated: {userRatings[item.id]} stars
            </Text>
          )}
        </View>

        <View style={styles.helpfulViewersContainer}>
          <View style={styles.helpfulSection}>
            <Text style={styles.sectionHeading}>Helpful</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: accentColor }]}
                onPress={() => Alert.alert("Feedback", "Marked as helpful!")}
              >
                <FontAwesome name="thumbs-up" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: accentColor }]}
                onPress={() =>
                  Alert.alert("Feedback", "Marked as not helpful!")
                }
              >
                <FontAwesome name="thumbs-down" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.viewersSection}>
            <Text style={styles.sectionHeading}>Viewers</Text>
            <View style={styles.viewersInfo}>
              <FontAwesome name="eye" size={20} color={accentColor} />
              <Text style={styles.viewersCount}>
                {articleViews[item.id]?.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Comment</Text>
          <View style={styles.commentBox}>
            <TextInput
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor="#999"
              value={comments[item.id] || ""}
              onChangeText={(text) =>
                setComments((prev) => ({ ...prev, [item.id]: text }))
              }
            />
            <TouchableOpacity
              style={[styles.postBtn, { backgroundColor: accentColor }]}
              onPress={() => handlePostComment(item.id)}
            >
              <Text style={styles.postText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Modern Header with Beautiful Background */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Knowledge Base</Text>
            <Text style={styles.headerSubtitle}>Discover & Learn</Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchArticles}
          >
            <MaterialIcons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredArticles.length}</Text>
            <Text style={styles.statLabel}>Articles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{categories.length - 1}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {articlesData
                .reduce((total, article) => total + article.views, 0)
                .toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
        </View>
      </View>

      {/* Feature Cards */}
      {renderFeatureCards()}

      {/* Enhanced Interactive Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.sectionTitleContainer}>
          <FontAwesome name="search" size={24} color="#6366F1" />
          <Text style={styles.sectionTitle}>Find What You Need</Text>
          <View style={styles.titleUnderline} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <FontAwesome
              name="search"
              size={18}
              color="#6366F1"
              style={styles.searchIcon}
            />
            <TextInput
              ref={searchInputRef} // Add ref to manage focus
              style={styles.searchInput}
              placeholder="Search articles, authors, categories..."
              placeholderTextColor="#94A3B8"
              value={searchInput}
              onChangeText={setSearchInput}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoCorrect={false} // Prevent auto-correction that might cause re-renders
              autoCapitalize="none" // Prevent auto-capitalization that might cause issues
              blurOnSubmit={true} // Blur when submit is pressed
            />
            {searchInput.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                style={styles.clearButton}
              >
                <FontAwesome name="times-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            activeOpacity={0.8}
          >
            
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Filter Section */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showCategoryFilter && styles.filterButtonActive,
            ]}
            onPress={() => setShowCategoryFilter(!showCategoryFilter)}
            activeOpacity={0.8}
          >
            <View style={styles.filterButtonContent}>
              <FontAwesome name="filter" size={16} color="#6366F1" />
              <Text style={styles.filterButtonText}>
                {selectedCategory === "All"
                  ? "Filter by Category"
                  : selectedCategory}
              </Text>
            </View>
            <FontAwesome
              name={showCategoryFilter ? "chevron-up" : "chevron-down"}
              size={14}
              color="#6366F1"
            />
          </TouchableOpacity>

          {showCategoryFilter && (
            <View style={styles.categoryDropdown}>
              <ScrollView
                style={styles.categoryScrollView}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {categories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category &&
                        styles.selectedCategoryOption,
                      index === categories.length - 1 &&
                        styles.lastCategoryOption,
                    ]}
                    onPress={() => handleCategoryFilter(category)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        selectedCategory === category &&
                          styles.selectedCategoryText,
                      ]}
                      numberOfLines={2}
                    >
                      {category}
                    </Text>
                    {selectedCategory === category && (
                      <FontAwesome name="check" size={16} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Enhanced Search Results Info */}
        {(filteredArticles.length !== articlesData.length ||
          selectedCategory !== "All") && (
          <View style={styles.searchResultsContainer}>
            <FontAwesome name="info-circle" size={16} color="#6366F1" />
            <Text style={styles.searchResults}>
              {selectedCategory !== "All" && `Category: ${selectedCategory} - `}
              Found {filteredArticles.length} article
              {filteredArticles.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Articles Section Title */}
      <View style={styles.articlesSectionHeader}>
        <Text style={styles.articlesTitle}>Latest Articles</Text>
        <View style={styles.articlesTitleUnderline} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34e3b0" />
        <Text style={styles.loadingText}>Loading Knowledge Base...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredArticles}
      keyExtractor={(item) => item.id}
      renderItem={renderArticle}
      contentContainerStyle={styles.container}
      ListHeaderComponent={renderHeader}
      showsVerticalScrollIndicator={false}
      refreshing={loading}
      onRefresh={fetchArticles}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f4f4f4",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },

  headerContainer: {
    marginBottom: 24,
  },

  header: {
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 30,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },

  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginTop: 2,
  },

  refreshButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },

  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
    fontWeight: "500",
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 10,
  },

  // Enhanced Search Section Styles
  searchSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginTop: 36,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 8,
    textAlign: "center",
  },

  titleUnderline: {
    width: 50,
    height: 3,
    backgroundColor: "#6366F1",
    borderRadius: 2,
    marginTop: 8,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8, // Fixed: Reduced padding for better text input experience
    borderWidth: 2,
    borderColor: "#E2E8F0",
    minHeight: 50, // Fixed: Proper minimum height for touch area
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    paddingVertical: 8, // Fixed: Added proper vertical padding instead of minHeight
    textAlign: "left", // Fixed: Left align text for natural typing experience
    // Removed textAlignVertical and minHeight to prevent cursor jumping
  },

  searchIcon: {
    opacity: 0.8,
  },

  clearButton: {
    padding: 4,
  },

  searchButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  searchButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    padding:8,
  },

  filterContainer: {
    marginBottom: 16,
  },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },

  filterButtonActive: {
    borderColor: "#6366F1",
    backgroundColor: "#F0F4FF",
  },

  filterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  filterButtonText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },

  categoryDropdown: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 8,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },

  categoryScrollView: {
    maxHeight: 220,
  },

  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    minHeight: 56,
  },

  selectedCategoryOption: {
    backgroundColor: "#F0FDF4",
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },

  categoryOptionText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },

  selectedCategoryText: {
    color: "#059669",
    fontWeight: "700",
  },

  lastCategoryOption: {
    borderBottomWidth: 0,
  },

  searchResultsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F0F4FF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },

  searchResults: {
    fontSize: 14,
    color: "#4C1D95",
    fontWeight: "600",
  },

  articlesSectionHeader: {
    alignItems: "center",
    marginBottom: 8, // Fixed: Reduced from 16 to 8 to decrease spacing
  },

  articlesTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
  },

  articlesTitleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: "#4A90E2",
    borderRadius: 2,
    marginTop: 8,
  },

  // Enhanced Feature Cards
  featureCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },

  featureCard: {
    width: "48%",
    aspectRatio: 1.3,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1 }],
    paddingTop: 20,
  },

  featureIconContainer: {
    position: "relative",
    top: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 16,

    borderRadius: 50,
    marginBottom: 12,
  },

  featureTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },

  featureDescription: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
    fontWeight: "600",
  },

  articleContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  articleNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  articleId: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  authorImageInitials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  authorDesignation: {
    fontSize: 13,
    color: "#64748b",
    fontStyle: "italic",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
    lineHeight: 28,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  category: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 20,
    lineHeight: 24,
  },
  userRatingSection: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rateLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  userStarsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  interactiveStar: {
    padding: 4,
  },
  userRatingText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  helpfulViewersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 20,
  },
  helpfulSection: {
    flex: 1,
  },
  viewersSection: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 16,
  },
  iconBtn: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  viewersInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewersCount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },
  commentBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#374151",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  postBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  postText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 16,
  },
});

export default KnowledgeHome;
