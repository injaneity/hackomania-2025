import React, { useEffect, useState } from 'react';
import { Button, StyleSheet } from 'react-native';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type RoomData = {
	players: { [key: string]: string | null };
	counts: { [key: string]: number };
};

export default function GameRoom() {
	const roomRef = doc(db, 'rooms', 'room1');
	const [roomData, setRoomData] = useState<RoomData | null>(null);
	const [myPlayer, setMyPlayer] = useState<string | null>(null);

	// Initialize the room if it does not exist
	const initRoom = async () => {
		const docSnap = await getDoc(roomRef);
		if (!docSnap.exists()) {
			await setDoc(roomRef, {
				players: { '1': null, '2': null },
				counts: { '1': 0, '2': 0 },
			});
		}
	};

	useEffect(() => {
		initRoom();
		const unsubscribe = onSnapshot(roomRef, (docSnap) => {
			if (docSnap.exists()) {
				setRoomData(docSnap.data() as RoomData);
			}
		});
		return unsubscribe;
	}, []);

	// Join as a player if the slot is available
	const joinRoom = async (playerNumber: string) => {
		if (!roomData) return;
		if (roomData.players[playerNumber]) return; // already taken
		await updateDoc(roomRef, {
			[`players.${playerNumber}`]: 'joined',
		});
		setMyPlayer(playerNumber);
	};

	// Increment count for the joined player
	const incrementCount = async () => {
		if (!myPlayer || !roomData) return;
		const newCount = roomData.counts[myPlayer] + 1;
		await updateDoc(roomRef, {
			[`counts.${myPlayer}`]: newCount,
		});
	};

	// Leave the room and clear player's slot
	const leaveRoom = async () => {
		if (!myPlayer) return;
		await updateDoc(roomRef, {
			[`players.${myPlayer}`]: null,
		});
		setMyPlayer(null);
	};

	const totalCount = roomData ? Object.values(roomData.counts).reduce((a, b) => a + b, 0) : 0;
	const myCount = roomData && myPlayer ? roomData.counts[myPlayer] : 0;

	return (
		<ThemedView style={styles.container}>
			<ThemedText type="title">Game Room</ThemedText>
			{myPlayer ? (
				<>
					<ThemedText>Your player number: {myPlayer}</ThemedText>
					<ThemedText>Your count: {myCount}</ThemedText>
					<ThemedText>Total count: {totalCount}</ThemedText>
					<Button title="Increment My Count" onPress={incrementCount} />
					<Button title="Leave Room" onPress={leaveRoom} />
				</>
			) : (
				<>
					<ThemedText>Select a player number:</ThemedText>
					<Button
						title="Join as Player 1"
						onPress={() => joinRoom('1')}
						disabled={roomData?.players['1'] !== null}
					/>
					<Button
						title="Join as Player 2"
						onPress={() => joinRoom('2')}
						disabled={roomData?.players['2'] !== null}
					/>
				</>
			)}
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		padding: 16,
	},
});
