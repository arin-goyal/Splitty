import { useState } from 'react'
import EyeIcon from 'D://Summer_Project_1//Splitty//src//assets//Eye_on.svg'
import EyeOffIcon from 'D://Summer_Project_1//Splitty//src//assets//Eye_off.svg'
import type React from 'react'

interface PasswordInputBoxProps {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const PasswordInputBox = ({ label, value, onChange }: PasswordInputBoxProps) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex w-full max-w-[320px] p-[16px] justify-between items-center self-stretch rounded-[26px] border-[1px] border-neutral_3">
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={label}
        value={value}
        onChange={onChange}
        className="bg-transparent text-neutral_2 w-full outline-none font-satoshi text-[16px] font-normal leading-[20px] placeholder-neutral_4"
      />
      <img
        src={showPassword ? EyeOffIcon : EyeIcon}
        alt="Toggle visibility"
        className="w-[20px] h-[20px] cursor-pointer"
        onClick={() => setShowPassword(!showPassword)}
      />
    </div>
  )
}

export default PasswordInputBox
