// import React, { useEffect, useState } from "react";
// import { createDrawerNavigator } from "@react-navigation/drawer";
// import KnowledgeHome from "../screens/KnowledgeHome";
// import FAQScreen from "../screens/Faqscreen"; // We'll reuse this as the category screen
// import axios from "axios";
// import { ActivityIndicator } from "react-native";

// const Drawer = createDrawerNavigator();

// const KnowledgeNavigator = () => {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Fetch categories on mount
//   useEffect(() => {
//     axios
//       .get("http://10.239.62.149:5000/api/auth/kbcategories")
//       .then((res) => {
//         setCategories(res.data); // [{ sys_id, label }]
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Error fetching categories:", err);
//         setLoading(false);
//       });
//   }, []);

//   if (loading)
//     return (
//       <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />
//     );

//   return (
//     <Drawer.Navigator
//       initialRouteName="KnowledgeHome"
//       screenOptions={{
//         headerShown: true,
//         drawerType: "slide",
//         drawerStyle: {
//           backgroundColor: "#f0f0f0",
//           width: 240,
//         },
//       }}
//     >
//       {/* Static Home */}
//       <Drawer.Screen
//         name="KnowledgeHome"
//         component={KnowledgeHome}
//         options={{ title: "Home" }}
//       />

//       {/* Dynamic categories */}
//       {categories.map((category) => (
//         <Drawer.Screen
//           key={category.sys_id}
//           name={category.label}
//           component={FAQScreen}
//           initialParams={{
//             categoryId: category.sys_id,
//             categoryLabel: category.label,
//           }}
//           options={{ title: category.label }}
//         />
//       ))}
//     </Drawer.Navigator>
//   );
// };

// export default KnowledgeNavigator;

import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import KnowledgeHome from "../screens/KnowledgeHome";

const Stack = createStackNavigator();

const KnowledgeNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="KnowledgeHome"
      screenOptions={{
        headerShown: false, // Hide header since KnowledgeHome has its own header
      }}
    >
      <Stack.Screen
        name="KnowledgeHome"
        component={KnowledgeHome}
        options={{ title: "Knowledge Base" }}
      />
    </Stack.Navigator>
  );
};

export default KnowledgeNavigator;
