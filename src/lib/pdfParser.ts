/**
 * Utility untuk mengekstrak teks bersih dari dokumen PDF dan TXT di browser.
 * Mencegah binary bytecode (%PDF-1.4 stream) masuk ke dalam input form.
 */

declare global {
  interface Window {
    pdfjsLib?: {
      getDocument: (params: { data: ArrayBuffer }) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNumber: number) => Promise<{
            getTextContent: () => Promise<{
              items: Array<{ str?: string }>;
            }>;
          }>;
        }>;
      };
      GlobalWorkerOptions: {
        workerSrc: string;
      };
    };
  }
}

/**
 * Memuat library PDF.js dari CDN terpercaya secara dinamis jika belum tersedia di window.
 */
function loadPdfJsScript(): Promise<typeof window.pdfjsLib> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PDF.js hanya dapat dijalankan di browser.'));
  }

  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('pdfjs-cdn-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('Gagal memuat PDF.js'));
        }
      });
      existingScript.addEventListener('error', () => reject(new Error('Gagal mengunduh script PDF.js')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'pdfjs-cdn-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;

    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js tidak terdefinisi setelah script dimuat.'));
      }
    };

    script.onerror = () => {
      reject(new Error('Tidak dapat terhubung ke CDN PDF.js.'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Ekstrak teks bersih dari file yang diunggah pengguna.
 * Menjamin file PDF diekstrak teks per halamannya dan BUKAN raw binary stream.
 */
export async function extractCvTextFromFile(file: File): Promise<{
  text: string;
  isExtracted: boolean;
  message?: string;
}> {
  const fileName = file.name.toLowerCase();

  // 1. Jika file TXT, baca langsung teksnya
  if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
    try {
      const content = await file.text();
      return {
        text: content.trim(),
        isExtracted: true,
      };
    } catch {
      return {
        text: '',
        isExtracted: false,
        message: 'Gagal membaca isi file teks.',
      };
    }
  }

  // 2. Jika file PDF, parse menggunakan PDF.js
  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
    try {
      const pdfjs = await loadPdfJsScript();
      if (!pdfjs) {
        throw new Error('PDF.js tidak tersedia.');
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      let extractedFullText = '';

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items
          .map((item) => (item.str ? item.str : ''))
          .filter((str) => str.trim().length > 0);

        extractedFullText += pageStrings.join(' ') + '\n';
      }

      const cleanText = extractedFullText.trim();

      // Cek apakah ada teks terbaca (bukan PDF hasil scan gambar murni tanpa OCR)
      if (cleanText.length > 20) {
        return {
          text: cleanText,
          isExtracted: true,
        };
      }

      // Jika PDF adalah gambar/scan tanpa teks digital
      return {
        text: '',
        isExtracted: false,
        message: 'Dokumen PDF berupa hasil scan/gambar tanpa teks digital. Silakan ketik atau tempel ringkasan pengalaman Anda.',
      };
    } catch (err) {
      console.warn('Gagal mengekstrak teks PDF:', err);
      // PENTING: JANGAN PERNAH panggil file.text() pada PDF karena akan menghasilkan raw bytecode %PDF-1.4!
      return {
        text: '',
        isExtracted: false,
        message: 'Teks PDF tidak dapat diekstrak otomatis. Silakan tempel poin-poin CV Anda di kolom di bawah.',
      };
    }
  }

  // 3. Format file lainnya
  return {
    text: '',
    isExtracted: false,
    message: 'Format file tidak didukung. Mohon gunakan file PDF atau TXT.',
  };
}
