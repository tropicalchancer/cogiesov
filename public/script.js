document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const articleInput = document.getElementById('articleInput');
    const analyzeButton = document.getElementById('analyzeButton');
    const resultsCard = document.getElementById('resultsCard');
    const supportersList = document.getElementById('supportersList');
    const oppositionList = document.getElementById('oppositionList');
    const controversyContent = document.getElementById('controversyContent');
    const contextContent = document.getElementById('contextContent');
    const ideasContent = document.getElementById('ideasContent');

    // Parse the AI response into sections
    function parseResponse(text) {
        const sections = {};
        
        // Extract Perspectives section
        const perspectivesMatch = text.match(/Perspectives([\s\S]*?)(?=Context & Background|$)/i);
        if (perspectivesMatch) {
            sections.perspectives = perspectivesMatch[1].trim();
        }
        
        // Extract Context & Background section
        const contextMatch = text.match(/Context & Background([\s\S]*?)(?=Key Ideas & Themes|$)/i);
        if (contextMatch) {
            sections.context = contextMatch[1].trim();
        }
        
        // Extract Key Ideas & Themes section
        const ideasMatch = text.match(/Key Ideas & Themes([\s\S]*?)$/i);
        if (ideasMatch) {
            sections.ideas = ideasMatch[1].trim();
        }
        
        return sections;
    }

    // Parse bullet points with fallback
    function parseBulletPoints(text) {
        if (!text) return [];
        
        const bulletPoints = text.split('\n')
            .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
            .map(line => line.trim().substring(1).trim());
            
        if (bulletPoints.length === 0) {
            return text.split(/[.!?]/)
                .map(sentence => sentence.trim())
                .filter(sentence => sentence.length > 0);
        }
        
        return bulletPoints;
    }

    function updateSection(element, content, defaultMessage) {
        if (element) {
            if (Array.isArray(content) && content.length > 0) {
                element.innerHTML = content.map(item => 
                    `<li>${item}</li>`
                ).join('');
            } else if (typeof content === 'string' && content.trim()) {
                element.innerHTML = `<li>${content}</li>`;
            } else {
                element.innerHTML = `<li>${defaultMessage}</li>`;
            }
        }
    }

    analyzeButton.addEventListener('click', async () => {
        const articleText = articleInput.value.trim();
        if (!articleText) return;

        try {
            // Update UI to loading state
            analyzeButton.disabled = true;
            analyzeButton.textContent = 'Analyzing...';
            resultsCard.style.display = 'none';

            // Send request to backend
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ article: articleText }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.analysis) {
                throw new Error('No analysis data received');
            }

            // Parse the analysis into sections
            const sections = parseResponse(data.analysis);

            // Update Perspectives section
            if (sections.perspectives) {
                const parts = sections.perspectives.split(/(Likely Opposition:|Key Points of Controversy:)/);
                
                const supportersText = parts[0];
                const oppositionText = parts[1] === 'Likely Opposition:' ? parts[2] : '';
                const controversyText = parts[3] === 'Key Points of Controversy:' ? parts[4] : '';

                // Update each section
                updateSection(supportersList, 
                    parseBulletPoints(supportersText), 
                    'Analysis pending for supporter perspectives'
                );

                updateSection(oppositionList, 
                    parseBulletPoints(oppositionText), 
                    'Analysis pending for opposition perspectives'
                );

                if (controversyText && controversyText.trim()) {
                    const points = parseBulletPoints(controversyText);
                    controversyContent.innerHTML = points.length > 0 
                        ? points.map(point => `<p>• ${point}</p>`).join('')
                        : `<p>• ${controversyText.trim()}</p>`;
                } else {
                    controversyContent.innerHTML = '<p>• Analysis pending for key points of controversy</p>';
                }
            }

            // Update Context and Ideas sections
            contextContent.textContent = sections.context || 'Analysis pending for context and background';
            ideasContent.textContent = sections.ideas || 'Analysis pending for key ideas and themes';

            // Show results
            resultsCard.style.display = 'block';

        } catch (error) {
            console.error('Analysis failed:', error);
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Analysis failed. Please try again.';
            errorMessage.classList.add('visible');
            setTimeout(() => {
                errorMessage.classList.remove('visible');
            }, 5000);
        } finally {
            // Reset button state
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyze';
        }
    });
});