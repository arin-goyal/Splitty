// pages/Friends.tsx
import { useState, useEffect } from "react";
import FriendCard from "../components/ui/Friends/FriendCard";
import FriendRequestCard from "../components/ui/Friends/FriendRequestCard";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, getDocs, collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type UserInfo = {
  uid: string;
  name: string;
};

const Friends = () => {
  const [incomingRequests, setIncomingRequests] = useState<UserInfo[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<UserInfo[]>([]);
  const [friends, setFriends] = useState<UserInfo[]>([]);

  const [userEmail, setUserEmail] = useState<string | null>(null);

  // getting the user's email id
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      }
    });

    return () => unsubscribe(); // clean up listener
  }, []);

  // Add friend function
  const handleAddFriend = async () =>{
    const email = prompt("Enter the email:");
    if (!email) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (userEmail && email.trim().toLowerCase() === userEmail.toLowerCase()) {
      alert("You cannot send a friend request to yourself!");
      return;
    }

    try{
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty){
        alert("User not found.");
        return;
      }

      const targetDoc = querySnapshot.docs[0];
      const targetUID = targetDoc.id;

      await updateDoc(doc(db, "users", currentUser.uid), {
        "friendRequests.outgoing": arrayUnion(targetUID)
      });
      
      await updateDoc(doc(db, "users", targetUID), {
        "friendRequests.incoming": arrayUnion(currentUser.uid)
      });

      alert("Friend request sent!");
    } catch (error) {
      console.error("Error adding friend:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  // Accept friend request function
  const handleAccept = async (senderUID: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const currentUserRef = doc(db, "users", currentUser.uid);
    const senderRef = doc(db, "users", senderUID);

    try {
      // Add each other as friends
      await updateDoc(currentUserRef, {
        friends: arrayUnion(senderUID),
        "friendRequests.incoming": arrayRemove(senderUID),
      });

      await updateDoc(senderRef, {
        friends: arrayUnion(currentUser.uid),
        "friendRequests.outgoing": arrayRemove(currentUser.uid),
      });

      alert("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  // Reject friend request
  const handleReject = async (senderUID: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const currentUserRef = doc(db, "users", currentUser.uid);
    const senderRef = doc(db, "users", senderUID);

    try {
      await updateDoc(currentUserRef, {
        "friendRequests.incoming": arrayRemove(senderUID),
      });

      await updateDoc(senderRef, {
        "friendRequests.outgoing": arrayRemove(currentUser.uid),
      });

      alert("Friend request rejected.");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  // Cancel sent friend request
  const handleCancel = async (targetUID: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const currentUserRef = doc(db, "users", currentUser.uid);
    const targetUserRef = doc(db, "users", targetUID);

    try {
      await updateDoc(currentUserRef, {
        "friendRequests.outgoing": arrayRemove(targetUID),
      });

      await updateDoc(targetUserRef, {
        "friendRequests.incoming": arrayRemove(currentUser.uid),
      });

      alert("Friend request canceled.");
    } catch (error) {
      console.error("Error canceling friend request:", error);
    }
  };

  const removeFriend = async (friendUid: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("User not logged in");
      return;
    }

    const currentUserRef = doc(db, "users", currentUser.uid);
    const friendRef = doc(db, "users", friendUid);

    try {
      // Remove from both users' friends list
      await updateDoc(currentUserRef, {
        friends: arrayRemove(friendUid),
      });

      await updateDoc(friendRef, {
        friends: arrayRemove(currentUser.uid),
      });

      console.log("Friend removed successfully");
    } catch (err) {
      console.error("Error removing friend:", err);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);

      const unsubscribeSnapshot = onSnapshot(userRef, async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        const incoming = data.friendRequests?.incoming || [];
        const outgoing = data.friendRequests?.outgoing || [];
        const friendList = data.friends || [];

        const getUserInfoList = async (uids: string[]) => {
          const users: UserInfo[] = [];
          for (const uid of uids) {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (userSnap.exists()) {
              users.push({uid, name: userSnap.data().name || "Unknown"});
            }
          }
          return users;
        };

        setIncomingRequests(await getUserInfoList(incoming));
        setOutgoingRequests(await getUserInfoList(outgoing));
        setFriends(await getUserInfoList(friendList));
      });

      // Clean up snapshot listener
      return () => unsubscribeSnapshot();
    });

    // Clean up auth listener
    return () => unsubscribeAuth();
  }, []);


  return (
    <div className="min-h-screen p-6 bg-background text-white">
      <div className="text-sm text-neutral-600 mb-2">
        Logged in as: <span className="font-medium">{userEmail}</span>
      </div>

      <h2 className="text-2xl font-bold mb-4">Friends</h2>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Friend Requests</h3>
        <div className="flex flex-col gap-2">
          {incomingRequests.map((user) => (
            <FriendRequestCard
              key={user.uid}
              name={user.name}
              type="incoming"
              onAccept={() => handleAccept(user.uid)}
              onReject={() => handleReject(user.uid)}
            />
          ))}
          {outgoingRequests.map((user) => (
            <FriendRequestCard
              key={user.uid}
              name={user.name}
              type="outgoing"
              onCancel={() => handleCancel(user.uid)}
            />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Your Friends</h3>
        <div className="flex flex-col gap-2">
          {friends.map((user) => (
            <FriendCard 
              key={user.uid} 
              name={user.name} 
              onRemove={() => removeFriend(user.uid)} />
          ))}
        </div>
      </section>

      <div className="text-center">
        <button 
          className="bg-neutral_1 text-neutral_5 px-6 py-2 rounded-full font-medium"
          onClick={handleAddFriend}
        >
          Add Friend
        </button>
      </div>
    </div>
  );
};

export default Friends;


// testing commit push