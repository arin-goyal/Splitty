interface FriendCardProps {
  name: string;
  onRemove?: () => void;
}

const FriendCard = ({ name, onRemove }: FriendCardProps) => {
  return (
    <div className="flex justify-between items-center bg-neutral_4 text-white px-4 py-3 rounded-lg shadow">
      <span>{name}</span>
      <button onClick={onRemove} className="text-red-400">Remove</button>
    </div>
  );
};

export default FriendCard;
