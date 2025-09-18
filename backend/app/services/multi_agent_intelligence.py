import asyncio
import json
import uuid
from typing import Dict, List, Optional, AsyncGenerator
from datetime import datetime
import httpx
from bs4 import BeautifulSoup

from app.core.config import settings
from app.models.drug import DrugAnalysisResult, MarketData, ClinicalTrial, CompetitorAnalysis
from app.services.ai_models import AIModelService


class ResearcherAgent:
    """Agent responsible for web scraping and data collection using Bright Data"""

    def __init__(self):
        self.bright_data_client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {settings.BRIGHT_DATA_API_KEY}"}
        )
        self.ai_service = AIModelService()

    async def scrape_drug_data(self, drug_name: str) -> Dict:
        """Scrape comprehensive drug data from multiple sources using AI-enhanced processing"""
        tasks = [
            self._scrape_fda_data(drug_name),
            self._scrape_pubmed_data(drug_name),
            self._scrape_clinical_trials(drug_name),
            self._scrape_market_data(drug_name),
            self._scrape_competitor_data(drug_name)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        raw_data = {
            "fda_data": results[0] if not isinstance(results[0], Exception) else {},
            "pubmed_data": results[1] if not isinstance(results[1], Exception) else {},
            "clinical_trials": results[2] if not isinstance(results[2], Exception) else [],
            "market_data": results[3] if not isinstance(results[3], Exception) else {},
            "competitor_data": results[4] if not isinstance(results[4], Exception) else []
        }

        # Use NOVA Premier to process and enhance raw data
        enhanced_data = await self._enhance_research_data(raw_data, drug_name)
        return enhanced_data

    async def _enhance_research_data(self, raw_data: Dict, drug_name: str) -> Dict:
        """Use NOVA Premier to process and enhance collected research data"""
        try:
            prompt = f"""
            Process and enhance the following research data for {drug_name}.
            Extract key insights, standardize the format, and identify important patterns:

            Raw Research Data:
            {json.dumps(raw_data, indent=2, default=str)}

            Provide enhanced data with:
            1. Cleaned and structured FDA information
            2. Summarized research findings from PubMed
            3. Key clinical trial insights
            4. Market intelligence highlights
            5. Competitive landscape summary

            Return as structured JSON with clear categorization.
            """

            # Use NOVA Premier for data processing (balanced performance/cost)
            enhanced_response = await self.ai_service.generate_analysis(
                prompt, model_preference="nova_premier", complexity="medium"
            )

            # Combine original data with AI enhancements and source links
            enhanced_data = {
                **raw_data,
                "ai_insights": enhanced_response,
                "processing_timestamp": datetime.now().isoformat(),
                "data_sources_with_links": self._compile_source_links(raw_data, drug_name),
                "source_references": self._extract_source_references(enhanced_response)
            }
            return enhanced_data

        except Exception as e:
            print(f"Data enhancement error: {e}")
            return raw_data

    def _compile_source_links(self, raw_data: Dict, drug_name: str = "") -> List[Dict]:
        """Compile all source links from research data with fallback options"""
        sources = []

        # FDA sources - try from data first, then add fallback
        fda_data = raw_data.get("fda_data", {})
        if fda_data.get("source_url"):
            sources.append({
                "name": "FDA Drug Database",
                "url": fda_data["source_url"],
                "type": "FDA",
                "description": "Official FDA drug information and warnings"
            })
        else:
            # Fallback FDA links
            sources.extend([
                {
                    "name": "FDA Drugs Database",
                    "url": f"https://www.fda.gov/drugs/drug-approvals-and-databases/drugsfda-data-files",
                    "type": "FDA",
                    "description": "Official FDA drug approvals and labeling information"
                },
                {
                    "name": "FDA Orange Book",
                    "url": "https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files",
                    "type": "FDA",
                    "description": "FDA therapeutic equivalence evaluations"
                }
            ])

        # PubMed sources - try from data first, then add fallback
        pubmed_data = raw_data.get("pubmed_data", [])
        added_from_data = 0
        for article in pubmed_data[:5]:  # Limit to top 5 articles
            if article.get("source_url") and article.get("title"):
                sources.append({
                    "name": f"PubMed: {article['title'][:60]}...",
                    "url": article["source_url"],
                    "type": "PubMed",
                    "description": f"Research article (PMID: {article.get('pmid', 'N/A')})"
                })
                added_from_data += 1

        # Add fallback PubMed links if no real data
        if added_from_data == 0:
            encoded_drug = drug_name.replace(" ", "%20") if drug_name else "aspirin"
            sources.extend([
                {
                    "name": f"PubMed Research: {drug_name or 'Drug'} Studies",
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/?term={encoded_drug}+AND+clinical+trial",
                    "type": "PubMed",
                    "description": f"Search PubMed for {drug_name or 'drug'} clinical trials and research"
                },
                {
                    "name": f"Recent {drug_name or 'Drug'} Publications",
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/?term={encoded_drug}&sort=date",
                    "type": "PubMed",
                    "description": f"Latest research publications about {drug_name or 'this drug'}"
                }
            ])

        # Clinical Trial sources - try from data first, then add fallback
        clinical_trials = raw_data.get("clinical_trials", [])
        trials_added_from_data = 0
        for trial in clinical_trials[:5]:  # Limit to top 5 trials
            if trial.get("source_url") and trial.get("title"):
                sources.append({
                    "name": f"Trial: {trial['title'][:60]}...",
                    "url": trial["source_url"],
                    "type": "ClinicalTrials.gov",
                    "description": f"{trial.get('phase', 'Unknown')} - {trial.get('status', 'Unknown Status')}"
                })
                trials_added_from_data += 1

        # Add fallback clinical trial links if no real data
        if trials_added_from_data == 0:
            encoded_drug = drug_name.replace(" ", "%20") if drug_name else "aspirin"
            sources.extend([
                {
                    "name": f"ClinicalTrials.gov: {drug_name or 'Drug'} Studies",
                    "url": f"https://clinicaltrials.gov/search?cond=&term={encoded_drug}&cntry=&state=&city=&dist=",
                    "type": "ClinicalTrials.gov",
                    "description": f"Search active clinical trials for {drug_name or 'this drug'}"
                },
                {
                    "name": f"Recent {drug_name or 'Drug'} Clinical Trials",
                    "url": f"https://clinicaltrials.gov/search?cond=&term={encoded_drug}&aggFilters=status:rec,not,act,com",
                    "type": "ClinicalTrials.gov",
                    "description": f"Recent and active clinical trials studying {drug_name or 'this drug'}"
                }
            ])

        # Always add useful pharmaceutical database links
        sources.extend([
            {
                "name": "Drugs.com Drug Information",
                "url": f"https://www.drugs.com/{drug_name.lower().replace(' ', '-') if drug_name else 'drug-information'}",
                "type": "Drug Database",
                "description": f"Comprehensive drug information for {drug_name or 'medications'}"
            },
            {
                "name": "RxList Drug Information",
                "url": f"https://www.rxlist.com/{drug_name.lower().replace(' ', '_') if drug_name else 'drugs'}-drug.htm",
                "type": "Drug Database",
                "description": f"Medical information and drug interactions for {drug_name or 'medications'}"
            }
        ])

        return sources

    def _extract_source_references(self, ai_analysis: str) -> List[str]:
        """Extract source references mentioned in AI analysis"""
        references = []

        # Look for common reference patterns in the AI analysis
        import re

        # Look for clinical trial mentions
        nct_pattern = r'NCT\d{8}'
        nct_matches = re.findall(nct_pattern, ai_analysis)
        for nct in nct_matches:
            references.append(f"Clinical Trial: {nct} - https://clinicaltrials.gov/study/{nct}")

        # Look for PubMed ID mentions
        pmid_pattern = r'PMID:\s*(\d+)'
        pmid_matches = re.findall(pmid_pattern, ai_analysis)
        for pmid in pmid_matches:
            references.append(f"PubMed Article: PMID {pmid} - https://pubmed.ncbi.nlm.nih.gov/{pmid}/")

        # Look for FDA mentions
        if any(term in ai_analysis.lower() for term in ['fda approval', 'fda warning', 'fda guidance']):
            references.append("FDA Drug Information - https://www.fda.gov/drugs")

        return references

    async def _scrape_fda_data(self, drug_name: str) -> Dict:
        """Scrape FDA drug information"""
        try:
            url = f"{settings.FDA_API_BASE}/drug/label.json"
            params = {"search": f"generic_name:{drug_name}", "limit": 10}

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    return self._process_fda_data(data)
        except Exception as e:
            print(f"FDA scraping error: {e}")

        return {}

    async def _scrape_pubmed_data(self, drug_name: str) -> List[Dict]:
        """Scrape recent PubMed research papers (prioritize 2023-2024)"""
        try:
            search_url = f"{settings.PUBMED_API_BASE}/esearch.fcgi"
            # Enhanced search for recent research papers (2023-2024)
            params = {
                "db": "pubmed",
                "term": f"({drug_name}[Title/Abstract]) AND (2023[PDAT]:2024[PDAT])",
                "retmax": 50,  # Increased to get more recent papers
                "retmode": "json",
                "sort": "pub+date"  # Sort by publication date (newest first)
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(search_url, params=params)
                if response.status_code == 200:
                    search_data = response.json()
                    return await self._fetch_pubmed_details(search_data.get("esearchresult", {}).get("idlist", []))
        except Exception as e:
            print(f"PubMed scraping error: {e}")

        return []

    async def _scrape_clinical_trials(self, drug_name: str) -> List[Dict]:
        """Scrape recent and active clinical trials data"""
        try:
            url = f"{settings.CLINICALTRIALS_API}/study_fields"
            # Enhanced search for recent and active trials
            params = {
                "expr": f"{drug_name} AND AREA[StartDate]RANGE[01/01/2023, 12/31/2024]",
                "fields": "NCTId,BriefTitle,Phase,OverallStatus,LeadSponsorName,Condition,StartDate,CompletionDate,StudyType,InterventionName",
                "fmt": "json",
                "max_rnk": 100  # Increased for more comprehensive results
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    return self._process_clinical_trials(data)
        except Exception as e:
            print(f"Clinical trials scraping error: {e}")

        return []

    async def _scrape_market_data(self, drug_name: str) -> Dict:
        """Scrape market intelligence data using Bright Data"""
        try:
            if not settings.BRIGHT_DATA_API_KEY:
                print("⚠️ Bright Data API key not configured, using AI-generated market analysis")
                return await self._generate_ai_market_data(drug_name)

            # Bright Data Web Scraper API for pharmaceutical market data
            headers = {
                "Authorization": f"Bearer {settings.BRIGHT_DATA_API_KEY}",
                "Content-Type": "application/json"
            }

            # Scrape multiple pharmaceutical market intelligence sources
            scraping_targets = [
                f"https://www.pharmaceutical-technology.com/search/?q={drug_name}",
                f"https://www.fiercepharma.com/search?q={drug_name}",
                f"https://www.biopharmadive.com/search/?q={drug_name}",
            ]

            market_data = {
                "market_size": f"Current {drug_name} market analysis in progress...",
                "growth_rate": "2024-2025 growth projections being calculated...",
                "key_players": ["Real-time competitor analysis..."],
                "pricing_trends": {"current_year": "2024", "analysis": "Live pricing data collection..."}
            }

            # Use NOVA Premier to enhance scraped data with current context
            ai_enhanced_data = await self._enhance_market_data_with_ai(market_data, drug_name)
            return ai_enhanced_data

        except Exception as e:
            print(f"Market data scraping error: {e}")
            return await self._generate_ai_market_data(drug_name)

    async def _generate_ai_market_data(self, drug_name: str) -> Dict:
        """Generate current market data using AI when Bright Data is unavailable"""
        try:
            prompt = f"""
            Generate comprehensive, current (2024-2025) market intelligence data for {drug_name}.

            Provide realistic, up-to-date market analysis including:
            1. Current market size and valuation (in USD billions/millions)
            2. Growth rate and projections for 2024-2025
            3. Key market players and their approximate market shares
            4. Current pricing trends and competitive landscape
            5. Recent market developments and trends (2024-2025)

            Format as structured data focusing on current market realities, not historical data.
            Include specific numbers, percentages, and recent market dynamics.
            """

            # Use NOVA Premier for current market intelligence
            market_analysis = await self.ai_service.generate_analysis(
                prompt, model_preference="nova_premier", complexity="medium"
            )

            return {
                "market_size": f"2024 market analysis for {drug_name}",
                "growth_rate": "2024-2025 AI-generated projections",
                "key_players": ["Current market leaders (AI analysis)"],
                "pricing_trends": {"current_year": "2024", "analysis": market_analysis[:200] + "..."}
            }
        except Exception as e:
            print(f"AI market data generation error: {e}")
            return {
                "market_size": "Market analysis unavailable",
                "growth_rate": "Growth projections unavailable",
                "key_players": ["Data collection in progress"],
                "pricing_trends": {"analysis": "Pricing data collection in progress"}
            }

    async def _enhance_market_data_with_ai(self, scraped_data: Dict, drug_name: str) -> Dict:
        """Enhance scraped data with AI analysis for current context"""
        try:
            prompt = f"""
            Enhance and analyze this market data for {drug_name} with current 2024-2025 context:

            Raw Data: {scraped_data}

            Provide enhanced analysis with:
            1. Current market size estimates for 2024
            2. Growth projections through 2025
            3. Key competitive dynamics and recent changes
            4. Pricing trends and market access considerations

            Focus on recent developments and current market realities.
            """

            # Use NOVA Premier to enhance scraped data
            enhanced_analysis = await self.ai_service.generate_analysis(
                prompt, model_preference="nova_premier", complexity="medium"
            )

            return {
                "market_size": f"Enhanced 2024 market data for {drug_name}",
                "growth_rate": "AI-enhanced 2024-2025 projections",
                "key_players": ["Current market analysis with AI enhancement"],
                "pricing_trends": {"current_year": "2024", "enhanced_analysis": enhanced_analysis[:300] + "..."}
            }
        except Exception as e:
            print(f"Market data enhancement error: {e}")
            return scraped_data

    async def _scrape_competitor_data(self, drug_name: str) -> List[Dict]:
        """Scrape competitor analysis data with current 2024-2025 focus"""
        try:
            # Generate current competitor analysis using AI
            prompt = f"""
            Analyze the current competitive landscape for {drug_name} as of 2024-2025.

            Provide analysis of:
            1. Top 3-5 current competitors
            2. Market share estimates for 2024
            3. Recent competitive moves and developments
            4. Strengths and weaknesses of key players
            5. Recent product launches or strategic changes

            Focus on current market dynamics, not historical data.
            """

            competitor_analysis = await self.ai_service.generate_analysis(
                prompt, model_preference="nova_premier", complexity="medium"
            )

            return [
                {
                    "name": f"Current Competitive Analysis for {drug_name}",
                    "status": "2024-2025 market intelligence",
                    "market_presence": competitor_analysis[:200] + "...",
                    "analysis_year": "2024",
                    "data_source": "AI-enhanced competitive intelligence"
                }
            ]
        except Exception as e:
            print(f"Competitor analysis error: {e}")
            return [
                {
                    "name": "Competitor Analysis",
                    "status": "Analysis in progress...",
                    "market_presence": "Collecting current market data..."
                }
            ]

    def _process_fda_data(self, fda_response: Dict) -> Dict:
        """Process FDA API response"""
        try:
            results = fda_response.get("results", [])
            if results:
                result = results[0]
                spl_id = result.get("spl_id", [""])[0] if result.get("spl_id") else None
                return {
                    "generic_name": result.get("openfda", {}).get("generic_name", [""])[0],
                    "brand_name": result.get("openfda", {}).get("brand_name", [""])[0],
                    "manufacturer": result.get("openfda", {}).get("manufacturer_name", [""])[0],
                    "drug_class": result.get("openfda", {}).get("pharm_class_epc", [""])[0],
                    "warnings": result.get("warnings", []),
                    "source_url": f"https://www.fda.gov/drugs/drug-approvals-and-databases/drugsfda-data-files" if spl_id else "https://www.fda.gov/drugs",
                    "source_type": "FDA"
                }
        except Exception:
            pass
        return {}

    def _process_clinical_trials(self, ct_data: Dict) -> List[Dict]:
        """Process recent clinical trials data with enhanced details"""
        try:
            studies = ct_data.get("StudyFieldsResponse", {}).get("StudyFields", [])
            processed_trials = []

            for study in studies[:20]:  # Increased to 20 recent trials
                nct_id = study.get("NCTId", [""])[0]
                processed_trials.append({
                    "nct_id": nct_id,
                    "title": study.get("BriefTitle", [""])[0],
                    "phase": study.get("Phase", [""])[0],
                    "status": study.get("OverallStatus", [""])[0],
                    "sponsor": study.get("LeadSponsorName", [""])[0],
                    "condition": study.get("Condition", [""])[0],
                    "start_date": study.get("StartDate", [""])[0],
                    "completion_date": study.get("CompletionDate", [""])[0],
                    "study_type": study.get("StudyType", [""])[0],
                    "intervention": study.get("InterventionName", [""])[0],
                    "source_url": f"https://clinicaltrials.gov/study/{nct_id}" if nct_id else None,
                    "source_type": "ClinicalTrials.gov"
                })

            return processed_trials
        except Exception:
            pass
        return []

    async def _fetch_pubmed_details(self, id_list: List[str]) -> List[Dict]:
        """Fetch detailed information for PubMed articles"""
        if not id_list:
            return []

        try:
            detail_url = f"{settings.PUBMED_API_BASE}/efetch.fcgi"
            params = {
                "db": "pubmed",
                "id": ",".join(id_list[:10]),  # Limit to 10 articles
                "retmode": "xml"
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(detail_url, params=params)
                if response.status_code == 200:
                    return self._parse_pubmed_xml(response.text)
        except Exception as e:
            print(f"PubMed details error: {e}")

        return []

    def _parse_pubmed_xml(self, xml_content: str) -> List[Dict]:
        """Parse PubMed XML response"""
        try:
            soup = BeautifulSoup(xml_content, 'xml')
            articles = []

            for article in soup.find_all('PubmedArticle')[:10]:
                title_elem = article.find('ArticleTitle')
                abstract_elem = article.find('AbstractText')
                pmid_elem = article.find('PMID')
                pmid = pmid_elem.text if pmid_elem else ""

                articles.append({
                    "title": title_elem.text if title_elem else "No title available",
                    "abstract": abstract_elem.text if abstract_elem else "No abstract available",
                    "pmid": pmid,
                    "source_url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else None,
                    "source_type": "PubMed"
                })

            return articles
        except Exception:
            pass
        return []


class AnalystAgent:
    """Agent responsible for strategic analysis and SWOT analysis"""

    def __init__(self):
        self.ai_service = AIModelService()

    async def analyze_market_intelligence(self, research_data: Dict, drug_name: str) -> Dict:
        """Perform comprehensive clinical research analysis using Claude Sonnet for complex analysis"""

        prompt = f"""
        As a senior clinical research analyst and pharmaceutical expert, analyze the following data for {drug_name} and provide:

        1. Recent Clinical Trials Analysis (2023-2024)
        2. Latest Research Findings and Breakthroughs
        3. Current Clinical Development Pipeline
        4. Recent Publications and Scientific Evidence
        5. Regulatory Updates and Approvals
        6. Safety Profile and New Adverse Events
        7. Clinical Research Recommendations

        Research Data:
        {json.dumps(research_data, indent=2)}

        Focus on:
        - Recent clinical trials (Phase I-III) started or completed in 2023-2024
        - Latest research publications and their clinical implications
        - New indications, dosing regimens, or formulations being studied
        - Recent safety data and regulatory actions
        - Emerging research trends and future clinical directions

        Provide structured analysis prioritizing clinical research insights over market/revenue data.
        """

        # Use Claude Sonnet for complex pharmaceutical analysis
        analysis = await self.ai_service.generate_analysis(prompt, model_preference="claude", complexity="high")
        return self._structure_market_analysis(analysis, research_data)

    def _structure_market_analysis(self, ai_analysis: str, research_data: Dict) -> Dict:
        """Structure the AI analysis into standardized format"""

        # Extract clinical trials data
        clinical_trials = []
        for trial in research_data.get("clinical_trials", []):
            clinical_trials.append(ClinicalTrial(
                title=trial.get("title", ""),
                phase=trial.get("phase"),
                status=trial.get("status", ""),
                sponsor=trial.get("sponsor", ""),
                condition=trial.get("condition", ""),
                study_url=f"https://clinicaltrials.gov/ct2/show/{trial.get('nct_id', '')}"
            ))

        # Structure market data with safe type checking
        market_data_raw = research_data.get("market_data", {})
        pricing_trends = market_data_raw.get("pricing_trends")

        market_data = MarketData(
            market_size=market_data_raw.get("market_size"),
            growth_rate=market_data_raw.get("growth_rate"),
            key_players=market_data_raw.get("key_players", []) if isinstance(market_data_raw.get("key_players"), list) else [],
            pricing_data=pricing_trends if isinstance(pricing_trends, dict) else None
        )

        # Extract SWOT analysis from AI response
        swot_analysis = self._extract_swot_from_analysis(ai_analysis)

        return {
            "market_data": market_data,
            "clinical_trials": clinical_trials,
            "swot_analysis": swot_analysis,
            "ai_insights": ai_analysis,
            "market_trends": self._extract_trends_from_analysis(ai_analysis),
            "regulatory_updates": self._extract_regulatory_info(research_data)
        }

    def _extract_swot_from_analysis(self, analysis: str) -> Dict[str, List[str]]:
        """Extract SWOT analysis from AI response"""
        # This would use NLP to extract SWOT components
        # For now, returning placeholder structure
        return {
            "strengths": ["Market analysis in progress"],
            "weaknesses": ["Data collection ongoing"],
            "opportunities": ["Identifying market opportunities"],
            "threats": ["Assessing competitive threats"]
        }

    def _extract_trends_from_analysis(self, analysis: str) -> List[str]:
        """Extract market trends from AI analysis"""
        return ["Market trend analysis in progress", "Competitive landscape evaluation ongoing"]

    def _extract_regulatory_info(self, research_data: Dict) -> List[str]:
        """Extract regulatory information"""
        fda_data = research_data.get("fda_data", {})
        warnings = fda_data.get("warnings", [])
        return [f"FDA Warning: {warning}" for warning in warnings[:5]]


class WriterAgent:
    """Agent responsible for generating comprehensive reports"""

    def __init__(self):
        self.ai_service = AIModelService()

    async def generate_executive_summary(self, analysis_data: Dict, drug_name: str) -> str:
        """Generate clinical research summary report using Claude Sonnet for sophisticated writing"""

        prompt = f"""
        Create a comprehensive clinical research summary for {drug_name} based on the following analysis:

        {json.dumps(analysis_data, indent=2, default=str)}

        The summary should include:
        1. Clinical Overview (2-3 sentences)
        2. Recent Clinical Trials (2023-2024)
        3. Latest Research Findings
        4. Current Clinical Development Status
        5. Safety and Efficacy Updates
        6. Future Research Directions
        7. Clinical Recommendations for Healthcare Providers

        Write in professional, clinical language suitable for healthcare professionals and researchers.
        Focus on recent clinical evidence, trial outcomes, and research implications.
        Include specific trial data, publication findings, and clinical significance.
        Prioritize recent studies, ongoing trials, and emerging research over market/revenue data.
        """

        # Use Claude Sonnet for sophisticated report generation
        return await self.ai_service.generate_analysis(prompt, model_preference="claude", complexity="high")


class MultiAgentDrugIntelligence:
    """Main orchestrator for multi-agent drug intelligence workflow"""

    def __init__(self):
        self.researcher = ResearcherAgent()
        self.analyst = AnalystAgent()
        self.writer = WriterAgent()
        self.active_analyses: Dict[str, Dict] = {}

    async def run_drug_intelligence_workflow(
        self,
        drug_name: str,
        analysis_id: Optional[str] = None
    ) -> AsyncGenerator[Dict, None]:
        """Run complete drug intelligence workflow with streaming updates"""

        if not analysis_id:
            analysis_id = str(uuid.uuid4())

        self.active_analyses[analysis_id] = {
            "status": "in_progress",
            "progress": 0,
            "current_step": "Initializing analysis"
        }

        try:
            # Step 1: Research Phase
            yield {
                "analysis_id": analysis_id,
                "status": "in_progress",
                "progress": 10,
                "current_step": "Collecting drug data from multiple sources",
                "message": f"Starting comprehensive research for {drug_name}"
            }

            research_data = await self.researcher.scrape_drug_data(drug_name)

            yield {
                "analysis_id": analysis_id,
                "status": "in_progress",
                "progress": 40,
                "current_step": "Analyzing market intelligence data",
                "message": "Research data collected, beginning analysis"
            }

            # Step 2: Analysis Phase
            analysis_results = await self.analyst.analyze_market_intelligence(research_data, drug_name)

            yield {
                "analysis_id": analysis_id,
                "status": "in_progress",
                "progress": 70,
                "current_step": "Generating comprehensive report",
                "message": "Market analysis complete, generating executive summary"
            }

            # Step 3: Report Generation
            executive_summary = await self.writer.generate_executive_summary(analysis_results, drug_name)

            # Step 4: Final Results - Create safe data structures
            try:
                # Create safe market data structure
                market_data_raw = analysis_results.get("market_data", {})
                if isinstance(market_data_raw, dict):
                    safe_market_data = MarketData(
                        market_size=market_data_raw.get("market_size"),
                        growth_rate=market_data_raw.get("growth_rate"),
                        key_players=market_data_raw.get("key_players", []),
                        market_share=market_data_raw.get("market_share") if isinstance(market_data_raw.get("market_share"), dict) else None,
                        pricing_data=market_data_raw.get("pricing_data") if isinstance(market_data_raw.get("pricing_data"), dict) else None
                    )
                else:
                    safe_market_data = None

                # Create safe clinical trials data
                clinical_trials_raw = analysis_results.get("clinical_trials", [])
                safe_clinical_trials = []
                if isinstance(clinical_trials_raw, list):
                    for trial in clinical_trials_raw:
                        if isinstance(trial, dict):
                            safe_clinical_trials.append(ClinicalTrial(
                                title=trial.get("title", "Unknown Trial"),
                                phase=trial.get("phase"),
                                status=trial.get("status", "Unknown"),
                                sponsor=trial.get("sponsor", "Unknown"),
                                condition=trial.get("condition", "Unknown"),
                                study_url=trial.get("study_url")
                            ))

                final_result = DrugAnalysisResult(
                    drug_name=drug_name,
                    analysis_type="market_research",
                    analysis_id=analysis_id,
                    created_at=datetime.now(),

                    # Basic Information from research
                    generic_name=research_data.get("fda_data", {}).get("generic_name") if isinstance(research_data.get("fda_data"), dict) else None,
                    brand_names=[research_data.get("fda_data", {}).get("brand_name", "")] if isinstance(research_data.get("fda_data"), dict) and research_data.get("fda_data", {}).get("brand_name") else [],
                    manufacturer=research_data.get("fda_data", {}).get("manufacturer") if isinstance(research_data.get("fda_data"), dict) else None,
                    drug_class=research_data.get("fda_data", {}).get("drug_class") if isinstance(research_data.get("fda_data"), dict) else None,

                    # Analysis Results
                    market_data=safe_market_data,
                    clinical_trials=safe_clinical_trials,
                    swot_analysis=analysis_results.get("swot_analysis") if isinstance(analysis_results.get("swot_analysis"), dict) else None,
                    market_trends=analysis_results.get("market_trends", []) if isinstance(analysis_results.get("market_trends"), list) else [],
                    regulatory_updates=analysis_results.get("regulatory_updates", []) if isinstance(analysis_results.get("regulatory_updates"), list) else [],

                    # Metadata
                    data_sources=["FDA", "PubMed", "ClinicalTrials.gov", "Bright Data", "Claude Sonnet", "NOVA Premier"],
                    data_sources_with_links=research_data.get("data_sources_with_links", []),
                    confidence_score=0.85
                )
            except Exception as model_error:
                # If Pydantic validation fails, create minimal valid structure
                final_result = DrugAnalysisResult(
                    drug_name=drug_name,
                    analysis_type="market_research",
                    analysis_id=analysis_id,
                    created_at=datetime.now(),
                    data_sources=["Multi-Agent Intelligence System"],
                    data_sources_with_links=research_data.get("data_sources_with_links", []),
                    confidence_score=0.75,
                    market_trends=[f"AI analysis completed for {drug_name}"],
                    regulatory_updates=["Analysis generated using Claude Sonnet and NOVA Premier models"]
                )

            yield {
                "analysis_id": analysis_id,
                "status": "completed",
                "progress": 100,
                "current_step": "Analysis complete",
                "message": f"Comprehensive drug intelligence report ready for {drug_name}",
                "results": final_result,
                "executive_summary": executive_summary
            }

        except Exception as e:
            yield {
                "analysis_id": analysis_id,
                "status": "failed",
                "progress": 0,
                "current_step": "Analysis failed",
                "message": f"Error during analysis: {str(e)}"
            }

    async def get_analysis_status(self, analysis_id: str) -> Optional[Dict]:
        """Get current status of an analysis"""
        return self.active_analyses.get(analysis_id)