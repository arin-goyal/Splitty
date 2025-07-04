import { useState } from "react";
import { motion } from "framer-motion";


const Home = () => {
  const [selected, setSelected] = useState(0);

  return (
    <div className="relative min-h-screen bg-background text-neutral_1 flex flex-col items-center justify-center pt-[48px] pb-[48px] overflow-hidden">

      {/* Background Grid Dots */}
      <img
        src="/assets/Background_dots.svg"
        className="absolute top-0 left-0 w-full h-screen object-cover z-0"
        alt="Background Dots"
      />

      {/* Bottom Navbar */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[560px] px-[36px] py-[36px] flex flex-col justify-center items-center z-50">
        <div className="relative flex p-[6px] justify-between items-start self-stretch rounded-[36px] border-[2px] border-[rgba(20,31,25,0.25)] bg-[rgba(6,_13,_16,_0.30)] backdrop-filter backdrop-blur-[12.5px]">

          {/* Floating Highlighter Box */}
          <motion.div
            className="absolute top-[6px] left-0 w-[25%] h-[60px] rounded-[30px] bg-neutral_1 z-0"
            animate={{ x: `${selected * 100}%` }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
            }}
          />

          {/* Nav Items */}
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`flex h-[60px] p-[8px] justify-center items-center gap-[10px] flex-[1_0_0] rounded-[30px] z-10 cursor-pointer ${
                selected === index ? "text-black" : "text-white"
              }`}
              onClick={() => setSelected(index)}
            >
              {/* Replace with icon or label */}
              <span>Item {index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
};

export default Home;
