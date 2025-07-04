interface Buttons {
  label: string
  icon?: React.ReactNode
  onClick?: () => void;
}

const Sign_in_with = ({ label, icon, onClick}: Buttons) => {
  return (
    <button 
      type="button"
      onClick={onClick}
      className="flex max-w-[320px] w-full justify-center p-[16px] items-center gap-[8px] rounded-[26px] bg-[rgba(94,_94,_94,_0.20)] backdrop-blur-[12.5px]">
      {icon && (
        <div className="h-[20px] w-auto flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="text-neutral_3 text-center font-satoshi text-[16px] not-italic font-normal leading-[20px]">
        {label}
      </div>
    </button>
  )
}

export default Sign_in_with
