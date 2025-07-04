// pages/Friends.tsx
import { useState, useEffect } from "react";
import FriendCard from "../components/ui/Friends/FriendCard";
import FriendRequestCard from "../components/ui/Friends/FriendRequestCard";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion, getDocs, collection, query, where, onSnapshot } from "firebase/firestore";



const Friends = () => {
  const [incomingRequests, setIncomingRequests] = useState<string[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<string[]>([]);
  const [friends, setFriends] = useState<string[]>([]);

  const handleAddFriend = async () =>{
    const email = prompt("Enter the email:");
    if (!email) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

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

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);

    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      // Set raw UIDs
      const incoming = data.friendRequests?.incoming || [];
      const outgoing = data.friendRequests?.outgoing || [];
      const friendList = data.friends || [];

      // Convert UIDs to names
      const getNames = async (uids: string[]) => {
        const names: string[] = [];
        for (const uid of uids) {
          const userSnap = await getDoc(doc(db, "users", uid));
          if (userSnap.exists()) {
            names.push(userSnap.data().name || "Unknown");
          }
        }
        return names;
      };

      setIncomingRequests(await getNames(incoming));
      setOutgoingRequests(await getNames(outgoing));
      setFriends(await getNames(friendList));
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  return (
    <div className="min-h-screen p-6 bg-background text-white">
      <h2 className="text-2xl font-bold mb-4">Friends</h2>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Friend Requests</h3>
        <div className="flex flex-col gap-2">
          {incomingRequests.map((name) => (
            <FriendRequestCard
              key={name}
              name={name}
              type="incoming"
              onAccept={() => alert(`Accepted ${name}`)}
              onReject={() => alert(`Rejected ${name}`)}
            />
          ))}
          {outgoingRequests.map((name) => (
            <FriendRequestCard
              key={name}
              name={name}
              type="outgoing"
              onCancel={() => alert(`Canceled request to ${name}`)}
            />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Your Friends</h3>
        <div className="flex flex-col gap-2">
          {friends.map((name) => (
            <FriendCard key={name} name={name} onRemove={() => alert(`Removed ${name}`)} />
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