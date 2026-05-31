import React from 'react';
import { Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-6 border-t border-gray-900 bg-[#060606] pt-10 pb-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* About Section */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-right px-4 sm:px-0">
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white mb-6 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-t from-[#D4AF37] to-[#F3E5AB] rounded-full inline-block"></span>
              من نحن
            </h3>
            <p className="text-gray-400 leading-relaxed text-sm lg:text-base max-w-md sm:max-w-none">
              سوق سند ليس مجرد منصة إعلانية تقليدية، بل هو واجهتك الملكية الموثوقة في عالم العروض والطلبات. 
              نحن نؤمن بأن كل إعلان يستحق أن يُعرض بأرقى صورة ليصل إلى الجمهور المستهدف بدقة واحترافية. 
              نسعى دائماً لتقديم تجربة مستخدم استثنائية تجمع بين سهولة التصفح، سرعة التواصل، والموثوقية العالية 
              لضمان نجاح صفقاتك وتنمية أعمالك.
            </p>
          </div>

          {/* Contact Section */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-right px-4 sm:px-0">
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white mb-6 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-t from-[#10B981] to-[#6EE7B7] rounded-full inline-block"></span>
              تواصل معنا
            </h3>
            <div className="space-y-4 w-full max-w-sm mx-auto sm:mx-0">
              <a 
                href="tel:92942482" 
                className="flex items-center justify-center sm:justify-start gap-4 bg-[#111] border border-gray-900 p-4 rounded-xl hover:border-[#D4AF37]/50 transition-colors group"
                dir="ltr"
              >
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors shrink-0">
                  <Phone className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <span className="text-white font-mono text-lg font-bold tracking-wider">92 942 482</span>
              </a>

              <a 
                href="https://wa.me/21692942482" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center sm:justify-start gap-4 bg-[#111] border border-gray-900 p-4 rounded-xl hover:border-[#25D366]/50 transition-colors group"
                dir="ltr"
              >
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
                     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <span className="text-white font-mono text-lg font-bold tracking-wider">92 942 482</span>
              </a>

              <a 
                href="mailto:sanadadvertise@gmail.com" 
                className="flex items-center justify-center sm:justify-start gap-4 bg-[#111] border border-gray-900 p-4 rounded-xl hover:border-gray-500 transition-colors group"
                dir="ltr"
              >
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center group-hover:bg-white/10 transition-colors shrink-0">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-white font-mono text-sm md:text-base font-bold truncate">sanadadvertise@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-900 text-center flex flex-col items-center gap-2">
            <h2 className="text-xl font-black font-display tracking-tight text-white/50">
              <span className="text-[#D4AF37]">سوق</span> سند
            </h2>
            <p className="text-gray-500 text-xs">جميع الحقوق محفوظة &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
