interface FriendRequestCardProps {
  name: string;
  type: "incoming" | "outgoing";
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

const FriendRequestCard = ({ name, type, onAccept, onReject, onCancel }: FriendRequestCardProps) => {
  return (
    <div className="flex justify-between items-center bg-neutral_4 text-white px-4 py-3 rounded-lg shadow">
      <span>{name}</span>
      {type === "incoming" ? (
        <div className="flex gap-2">
          <button onClick={onAccept} className="text-green-400">Accept</button>
          <button onClick={onReject} className="text-red-400">Reject</button>
        </div>
      ) : (
        <button onClick={onCancel} className="text-yellow-400">Cancel</button>
      )}
    </div>
  );
};

export default FriendRequestCard;
