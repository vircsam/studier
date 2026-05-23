import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-[#09090b] border-t border-[#27272a] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.1)]">
                <img
                  src="vircsam.png"
                  alt="logo"
                  className="w-full h-full object-cover block"
                />
              </div>
              <span className="font-semibold text-white">Vircsam</span>
            </div>
            <p className="text-sm text-[#71717a]">
              We solve people's problems with software.
              Contact: vircsamenterprises@gmail.com
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-[#a1a1aa]">
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-[#27272a] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#52525b]">© 2025 SeasonCycle Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <div className="w-5 h-5 bg-[#27272a] rounded-full hover:bg-[#3f3f46] transition-colors cursor-pointer"></div>
            <div className="w-5 h-5 bg-[#27272a] rounded-full hover:bg-[#3f3f46] transition-colors cursor-pointer"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};
