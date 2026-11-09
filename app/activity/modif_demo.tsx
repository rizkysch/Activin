 {categories.map((category) => (
<Pressable
key={category}
onPress={() => setSelectedCategory(category)}
style={{
paddingVertical: 8,
paddingHorizontal: 12,
borderRadius: 8,
backgroundColor:
selectedCategory === category ? "#060606" : "#f30404",
}}
 )

 return (
    <View style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#eb0909",
          borderRadius: 8,
          paddingHorizontal: 12,
          marginBottom: 16,
        }}
      >
        <Ionicons name="search" size={18} color="#ff0606" />
        <TextInput
          placeholder="Search Activity..."
          value={search}
          onChangeText={setSearch}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingLeft: 8,
          }}
        />
      </View>