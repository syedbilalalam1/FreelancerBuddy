# Document Analysis Tool 📚

An AI-powered tool for analyzing documents and automatically generating high-quality answers. Perfect for students, researchers, and professionals who need to analyze documents and generate comprehensive responses.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen.svg)

## 🚀 Quick Start

### Prerequisites
- Windows 10 or later
- [Node.js LTS version](https://nodejs.org/) (18.x or higher)
- Internet connection
- Your own API key (see Configuration section)

### Installation

1. Download and extract the project files
2. Create a `.env.local` file in the root directory with your API key:
   ```env
   OPENROUTER_API_KEY=your-api-key-here
   ```
3. Double-click `start.bat` to launch the application

The tool will automatically:
- Check if Node.js is installed
- Install required dependencies
- Start the application
- Open it in your default browser

## 🎯 Features

- 📄 Document Analysis
  - Upload and analyze PDF documents
  - Automatic content extraction
  - Smart context understanding

- ✍️ Answer Generation
  - AI-powered answer creation
  - Custom writing style options
  - Multiple question support

- 🤖 AI Assistant
  - Interactive chat interface
  - Context-aware responses
  - Real-time assistance

## 📖 How to Use

1. **Upload Context Document**
   - Click the upload area in the "Context Document" section
   - Select your source material (PDF format)
   - Wait for analysis to complete

2. **Upload Questions**
   - Click the upload area in the "Questions Document" section
   - Select your questions document (PDF format)
   - Wait for analysis to complete

3. **Generate Answers**
   - Click "Generate Answers"
   - Optionally add custom instructions
   - Download the generated PDF with answers

## ⚙️ Configuration

1. Get your API key:
   - Sign up at [OpenRouter](https://openrouter.ai/)
   - Create a new API key
   - Copy the API key

2. Create `.env.local`:
   ```env
   OPENROUTER_API_KEY=your-api-key-here
   ```

## 🔧 Troubleshooting

If you encounter issues:

1. **Application Won't Start**
   - Ensure Node.js (18.x or higher) is installed
   - Check if port 3000 is available
   - Try running `npm install` manually

2. **Upload Issues**
   - Ensure documents are in PDF format
   - Check file size (max 10MB)
   - Try closing and reopening the application

3. **Generation Issues**
   - Verify your API key is correct
   - Check your internet connection
   - Ensure both documents are properly uploaded

## 💡 Tips

- Use clear, well-formatted PDFs for best results
- Custom instructions can help tailor the answer style
- The AI chat can help clarify document content

## 📝 Notes

- Keep your API key secure and never share it
- The tool requires an active internet connection
- Processing time depends on document size and complexity

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review closed issues in the repository
3. Open a new issue if needed

## 🔒 Security

- Never share your `.env.local` file
- Keep your API keys private
- Regularly update your dependencies

---

Made with ❤️ for the academic community 
