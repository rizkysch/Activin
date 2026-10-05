import { Image, StyleSheet, Text, View, } from 'react-native';
import { Activity } from '../types/activity';

interface ActivityCardProps {
    activity: Activity;
}



export default function ActivityCard({activity}: ActivityCardProps) {
    return (
        <View>
            <Image source={{uri: activity.imageUrl}} 
            />
            <Text style={styles.title}>{activity.title}</Text>
            <Text style={styles.category}>{activity.category}</Text>
            <Text style={styles.location}>{activity.location}</Text>
            <Text style={styles.participants}>{activity.participants}/{activity.maxParticipants}</Text>
        </View>
    );
}


const styles = StyleSheet.create ({
    card: {
        marginBottom : 16,
        padding: 12, 
        borderRadius: 12,
        backgroundColor: "white",
    },

    image: {
        width : "100%",
        height: 180,
        borderRadius: 10,
    },

    title: {
        marginTop: 10,
        fontSize: 18, 
        fontWeight: "bold",
    },

    category: {
        marginTop: 4,
        fontSize: 14,
    },

    location: {
        marginTop: 4,
        fontSize: 14,
    },

    participants: {
        marginTop: 4,
        fontSize: 14,
    },

});