interface TextInputBoxProps {
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  name?: string
}

const TextInputBox = ({ 
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  name
}: TextInputBoxProps) => {
  return (
    <div className="w-full flex max-w-[320px] p-[16px] items-center gap-[8px] self-stretch rounded-[26px] border-[1px] border-neutral_3">
      <input
        className="w-full bg-transparent outline-none text-neutral_2 font-satoshi text-[16px] font-normal leading-[20px] placeholder-neutral_4"
        type={type}
        name={name}
        placeholder={placeholder || label}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

export default TextInputBox
