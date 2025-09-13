import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const articlesData = [
  {
    id: "1",
    title: "What is ServiceNow?",
    content:
      "ServiceNow is a cloud-based platform that automates workflows and supports IT service management...",
    image: "https://cdn-icons-png.flaticon.com/512/5968/5968992.png",
    category: "IT Service Management",
    rating: 4.5,
    author: {
      name: "Sarah Johnson",
      profileImage:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      designation: "IT Service Manager",
    },
    totalRatings: 124,
    views: 1247,
  },
  {
    id: "2",
    title: "How to Submit a Request?",
    content:
      "You can submit a request by navigating to the Service Catalog and selecting the appropriate item...",
    image: "https://cdn-icons-png.flaticon.com/512/2541/2541988.png",
    category: "Service Catalog",
    rating: 4.2,
    author: {
      name: "Mike Chen",
      profileImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      designation: "Service Catalog Specialist",
    },
    totalRatings: 89,
    views: 856,
  },
  {
    id: "3",
    title: "Understanding Knowledge Base",
    content:
      "The Knowledge Base is a repository of information that helps users resolve common issues...",
    image: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
    category: "Knowledge Management",
    rating: 4.8,
    author: {
      name: "Emily Rodriguez",
      profileImage:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      designation: "Knowledge Manager",
    },
    totalRatings: 203,
    views: 1892,
  },
  {
    id: "4",
    title: "Password Reset Guidelines",
    content:
      "Learn how to reset your password securely and troubleshoot common authentication issues...",
    image: "https://cdn-icons-png.flaticon.com/512/1828/1828471.png",
    category: "Security",
    rating: 4.3,
    author: {
      name: "Alex Thompson",
      profileImage:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      designation: "Security Specialist",
    },
    totalRatings: 156,
    views: 1034,
  },
];

const KnowledgeHome = () => {
  const [comments, setComments] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArticles, setFilteredArticles] = useState(articlesData);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [articleViews, setArticleViews] = useState(
    articlesData.reduce((acc, article) => {
      acc[article.id] = article.views;
      return acc;
    }, {})
  );

  const categories = [
    "All",
    ...new Set(articlesData.map((article) => article.category)),
  ];

  const handlePostComment = (articleId) => {
    if (!comments[articleId]?.trim()) return;
    alert(`Comment posted: ${comments[articleId]}`);
    setComments((prev) => ({ ...prev, [articleId]: "" }));
  };

  const handleRating = (articleId, rating) => {
    setUserRatings((prev) => ({ ...prev, [articleId]: rating }));
    alert(`You rated this article ${rating} stars!`);
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

  const handleSearch = (text) => {
    setSearchQuery(text);
    filterArticles(text, selectedCategory);
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
        icon: "eye",
        title: "View",
        description: "Browse articles",
        color: "#34e3b0",
      },
      {
        icon: "star",
        title: "Rate",
        description: "Rate articles",
        color: "#2563eb",
      },
      {
        icon: "comment",
        title: "Comment",
        description: "Share feedback",
        color: "#F59E0B",
      },
      {
        icon: "search",
        title: "Search",
        description: "Find content",
        color: "#F472B6",
      },
    ];

    return (
      <View style={styles.featureCardsContainer}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.featureCard, { backgroundColor: feature.color }]}
          >
            <FontAwesome name={feature.icon} size={24} color="#fff" />
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
          <Text style={styles.articleNumber}>Article #{articleNumber}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(item.rating)}
            </View>
            <Text style={styles.ratingText}>
              {item.rating} ({item.totalRatings})
            </Text>
          </View>
        </View>

        <View style={styles.authorContainer}>
          <Image
            source={{ uri: item.author.profileImage }}
            style={styles.authorImage}
          />
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
              >
                <FontAwesome name="thumbs-up" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: accentColor }]}
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
      <Text style={styles.headerTitle}>Knowledge Base</Text>

      {renderFeatureCards()}

      <Text style={styles.articlesTitle}>Articles</Text>

      <View style={styles.searchContainer}>
        <FontAwesome
          name="search"
          size={18}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles, authors, categories..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch("")}
            style={styles.clearButton}
          >
            <FontAwesome name="times-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowCategoryFilter(!showCategoryFilter)}
        >
          <FontAwesome name="filter" size={16} color="#374151" />
          <Text style={styles.filterButtonText}>
            {selectedCategory === "All"
              ? "Filter by Category"
              : selectedCategory}
          </Text>
          <FontAwesome
            name={showCategoryFilter ? "chevron-up" : "chevron-down"}
            size={14}
            color="#374151"
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
                    <FontAwesome name="check" size={16} color="#34e3b0" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {(filteredArticles.length !== articlesData.length ||
        selectedCategory !== "All") && (
        <Text style={styles.searchResults}>
          {selectedCategory !== "All" && `Category: ${selectedCategory} - `}
          Found {filteredArticles.length} article
          {filteredArticles.length !== 1 ? "s" : ""}
        </Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={filteredArticles}
      keyExtractor={(item) => item.id}
      renderItem={renderArticle}
      contentContainerStyle={styles.container}
      ListHeaderComponent={renderHeader}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f4f4f4",
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "left",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  categoryDropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryScrollView: {
    maxHeight: 250,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    minHeight: 50,
  },
  lastCategoryOption: {
    borderBottomWidth: 0,
  },
  selectedCategoryOption: {
    backgroundColor: "#f0fdf4",
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
    fontWeight: "600",
  },
  searchResults: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  featureCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 0,
    gap: 12,
  },
  featureCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
  },
  articlesTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",

    marginBottom: 4,
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
  authorImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#e2e8f0",
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
