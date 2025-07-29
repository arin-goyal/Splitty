import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  signInWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

import { auth, googleProvider, db } from '../firebase/firebaseConfig';

import AppleLogo from '../assets/Apple Logo.svg';
import GoogleLogo from '../assets/Google Logo.svg';
import SplittyLogo from '../assets/Splitty_Logo_linear.svg';

import TextInputBox from '../components/ui/InputBox/TextInputBox';
import PasswordInputBox from '../components/ui/InputBox/PasswordInputBox';
import Large_Button from '../components/ui/Buttons/Large_button';
import Sign_In_With_Button from '../components/ui/Buttons/Sign_In_with_button';

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🔐 Email/Password Sign-In
  const handleSignIn = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      alert(`Signed in as ${user.email}`);
      navigate('/Friends');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // 🔐 Google Sign-In + Firestore Integration
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      // Create user in Firestore if not already exists
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          friends: [],
          createdAt: new Date()
        });
        console.log('✅ New user document created in Firestore');
      }

      alert(`Signed in as ${user.displayName || user.email}`);
      navigate('/Friends');
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      alert(`Google Sign-In Error: ${error.message}`);
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

      <div className="flex w-full max-w-[800px] px-[36px] py-0 flex-col justify-center items-center">
        <div className="relative z-10 flex px-[24px] py-[24px] flex-col items-center gap-[32px] self-stretch rounded-[32px] border-[1.5px] border-[rgba(176,239,212,0.25)] bg-[rgba(42,_42,_42,_0.20)] backdrop-filter backdrop-blur-[12.5px]">

          {/* Logo */}
          <img src={SplittyLogo} className="flex w-[138.914px] h-[64px]" alt="Splitty Logo" />

          {/* Heading */}
          <div className="text-center text-[22px] font-bold leading-[28px] font-satoshi">
            Sign In to your account
          </div>

          {/* Email/Password Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSignIn();
            }}
            className="flex flex-col w-full max-w-[320px] items-center gap-[16px]"
          >
            <TextInputBox 
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInputBox
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="self-stretch text-neutral_2 text-right text-[13px] font-normal leading-[18px] font-satoshi">
              Forgot Password ?
            </div>

            <Large_Button label="Sign In" />
          </form>

          {/* Divider */}
          <div className="flex justify-center w-full">
            <div className="flex w-full max-w-[320px] items-center gap-[8px]">
              <div className="h-[1px] flex-grow bg-neutral_4" />
              <div className="text-neutral_4 text-[12px] font-medium leading-[16px] font-satoshi">Or</div>
              <div className="h-[1px] flex-grow bg-neutral_4" />
            </div>
          </div>

          {/* Social Sign-In */}
          <div className="flex flex-col w-full max-w-[320px] items-center gap-[16px]">
            <Sign_In_With_Button 
              label="Sign In With Google"
              icon={<img src={GoogleLogo} alt="Google" className="h-[20px]" />}
              onClick={handleGoogleSignIn}
            />

            <Sign_In_With_Button 
              label="Sign In With Apple"
              icon={<img src={AppleLogo} alt="Apple" className="h-[20px]" />}
              onClick={() => alert('Apple Sign-In is not available yet')}
            />

            <div className="text-neutral_3 text-center text-[13px] font-normal leading-[18px] font-satoshi">
              Don't have an account?{' '}
              <Link to="/signup" className="text-accent_1 underline cursor-pointer">
                Sign Up
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SignIn;
