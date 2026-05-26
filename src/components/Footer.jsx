import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-[#09090b] border-t border-[#27272a] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
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
            <p className="text-sm text-[#71717a] max-w-xs">
              We solve people's problems with software.<br/>
              Contact: vircsamenterprises@gmail.com
            </p>
          </div>
          <div className="md:text-right">
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-[#a1a1aa] flex flex-col md:items-end">
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-[#27272a] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#52525b]">© 2026 Studier Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="https://www.linkedin.com/company/vircsam/" target="_blank" rel="noopener noreferrer" className="text-[#52525b] hover:text-[#0a66c2] transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
