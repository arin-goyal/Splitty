interface Buttons {
  label: string
}

const Large_button = ({ label }: Buttons) => {
  return (
    <button 
      type="submit"
      className="flex w-full max-w-[320px] p-[16px] items-center gap-[8px] self-stretch rounded-[26px] bg-accent_1">
      <div className="w-full text-neutral_5 text-center font-satoshi text-[16px] not-italic font-medium leading-[20px]">
        {label}
      </div>
    </button>
  )
}

export default Large_button
