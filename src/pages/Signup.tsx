import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { auth, db, googleProvider } from '../firebase/firebaseConfig'

import { 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile 
} from 'firebase/auth'

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore' 

import AppleLogo from '../assets/Apple Logo.svg'
import GoogleLogo from '../assets/Google Logo.svg'
import SplittyLogo from '../assets/Splitty_Logo_linear.svg'
import TextInputBox from '../components/ui/InputBox/TextInputBox'
import PasswordInputBox from '../components/ui/InputBox/PasswordInputBox'
import Large_Button from '../components/ui/Buttons/Large_button'
import Sign_In_With_Button from '../components/ui/Buttons/Sign_In_with_button'

const SignUp = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleEmailPasswordSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.")
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // ✅ Update Firebase Auth Profile with name
      await updateProfile(user, {
        displayName: name
      })

      console.log("Updated Auth Profile:", auth.currentUser);

      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, {
        uid: user.uid,
        name: name,
        email: email,
        createdAt: serverTimestamp(),
        friends: [],
        friendRequests: [],
      })

      alert(`Account created! Welcome, ${user.displayName || name}`)
      navigate('/Friends');
    } catch (error: any) {
      console.error("Signup error:", error);
      alert(error.message)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Save user data to Firestore
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email,
          createdAt: serverTimestamp(),
          friends: [],
          friendRequests: [],
        });
      }

      alert(`Signed in with Google as ${user.displayName || user.email}`);
      navigate('/Friends');
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-neutral_1 flex flex-col items-center justify-center pt-[48px] pb-[48px] overflow-hidden">

      {/* Background Grid Dots */}
      <img 
        src="/assets/Background_dots.svg" 
        className="fixed top-0 left-0 w-full h-full object-cover z-0" 
        alt="Background Dots"
      />

      {/* Card */}
      <div className='flex w-full max-w-[800px] px-[36px] py-0 flex-col justify-center items-center'>
        <div className="relative z-10 flex px-[24px] py-[24px] flex-col items-center gap-[32px] self-stretch rounded-[32px] border-[1.5px] border-[rgba(176,239,212,0.25)] bg-[rgba(42,_42,_42,_0.20)] backdrop-filter backdrop-blur-[12.5px]">
          
          {/* Logo */}
          <div>
            <img src={SplittyLogo} className="flex w-[138.914px] h-[64px]" alt="Splitty Logo" />
          </div>
          
          {/* Create Account text */}
          <div className="self-stretch text-neutral_1 text-center text-[22px] font-bold leading-[28px] font-satoshi">
            Create a new account
          </div>
          
          {/* Sign Up Option */}
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              handleEmailPasswordSignup()
            }}
            className='flex flex-col w-full max-w-[320px] items-center gap-[16px]'
          >
            {/* Name */}
            <TextInputBox 
              label="Enter Your Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            
            {/* Email */}
            <TextInputBox 
              label="Enter Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password */}
            <PasswordInputBox
              label="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            {/* Re-Enter Password */}
            <PasswordInputBox
              label="Re-Enter Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            
            {/* Sign Up button */}
            <Large_Button label="Sign Up" />

          </form>

          {/* Divider */}
          <div className="flex justify-center w-full">
            <div className="flex w-full max-w-[320px] items-center gap-[8px]">
              <div className="h-[1px] flex-grow bg-neutral_4" />
              <div className="text-neutral_4 text-center text-[12px] font-medium leading-[16px] font-satoshi">Or</div>
              <div className="h-[1px] flex-grow bg-neutral_4" />
            </div>
          </div>

          {/* Other options */}
          <div className='flex flex-col w-full max-w-[320px] items-center gap-[16px]'>

            {/* Sign In with Google */}
            <Sign_In_With_Button 
              label="Sign In With Google"
              icon={<img src={GoogleLogo} alt="Google" className="h-[20px]" />}
              onClick={handleGoogleSignup}
            />
            
            {/* Sign In with Apple (non-functional for now) */}
            <Sign_In_With_Button 
              label="Sign In With Apple"
              icon={<img src={AppleLogo} alt="Apple" className="h-[20px]" />}
              onClick={() => alert("Apple Sign-In is not set up yet.")}
            />

            {/* Sign In option */}
            <div className='self-stretch max-w-[320px] text-neutral_3 text-center font-satoshi text-[13px] not-italic font-normal leading-[18px]'>
              Already have an account?{' '}
              <Link to="/signin" className="text-accent_1 underline cursor-pointer">
                Sign In
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
