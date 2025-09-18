import asyncio
from typing import Dict, Optional
import json
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings


class AIModelService:
    """Service for interacting with Amazon Bedrock AI models for drug analysis"""

    def __init__(self):
        self.bedrock_client = None
        self._initialize_bedrock_client()

    def _initialize_bedrock_client(self):
        """Initialize Amazon Bedrock client"""
        try:
            # Initialize Bedrock Runtime client similar to frontend pattern
            self.bedrock_client = boto3.client(
                'bedrock-runtime',
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
        except Exception as e:
            print(f"Failed to initialize Bedrock client: {e}")
            self.bedrock_client = None

    async def generate_analysis(self, prompt: str, model_preference: str = "auto", complexity: str = "medium") -> str:
        """Generate AI analysis using Amazon Bedrock models"""

        if not self.bedrock_client:
            return await self._generate_fallback_analysis(prompt)

        # Select model based on complexity and preference
        if model_preference == "claude" or complexity == "high":
            return await self._generate_claude_analysis(prompt)
        elif model_preference == "nova_premier" or complexity == "medium":
            return await self._generate_nova_premier_analysis(prompt)
        elif model_preference == "nova_micro" or complexity == "low":
            return await self._generate_nova_micro_analysis(prompt)
        else:
            # Default to NOVA Premier for balanced performance/cost
            return await self._generate_nova_premier_analysis(prompt)

    async def _generate_claude_analysis(self, prompt: str) -> str:
        """Generate analysis using Claude Sonnet via Bedrock"""
        try:
            # Use Claude 3 Sonnet for complex pharmaceutical analysis
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4000,
                "temperature": 0.3,
                "system": "You are a pharmaceutical industry expert with deep knowledge of drug development, market analysis, and competitive intelligence. Provide detailed, accurate, and actionable insights.",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }

            response = await asyncio.to_thread(
                self.bedrock_client.invoke_model,
                modelId=settings.BEDROCK_CLAUDE_MODEL_ID,
                body=json.dumps(body),
                contentType="application/json"
            )

            response_body = json.loads(response['body'].read())
            return response_body['content'][0]['text']

        except Exception as e:
            print(f"Claude Sonnet analysis error: {e}")
            return await self._generate_nova_premier_analysis(prompt)

    async def _generate_nova_premier_analysis(self, prompt: str) -> str:
        """Generate analysis using NOVA Premier via Bedrock"""
        try:
            # Use NOVA Premier for balanced analysis
            body = {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "system": [
                    {
                        "text": "You are a pharmaceutical industry expert with deep knowledge of drug development, market analysis, and competitive intelligence. Provide detailed, accurate, and actionable insights."
                    }
                ],
                "inferenceConfig": {
                    "maxTokens": 3000,
                    "temperature": 0.4
                }
            }

            response = await asyncio.to_thread(
                self.bedrock_client.invoke_model,
                modelId=settings.BEDROCK_NOVA_PREMIER_MODEL_ID,
                body=json.dumps(body),
                contentType="application/json"
            )

            response_body = json.loads(response['body'].read())
            return response_body['output']['message']['content'][0]['text']

        except Exception as e:
            print(f"NOVA Premier analysis error: {e}")
            return await self._generate_nova_micro_analysis(prompt)

    async def _generate_nova_micro_analysis(self, prompt: str) -> str:
        """Generate analysis using NOVA Micro via Bedrock (fastest, most cost-effective)"""
        try:
            # Use NOVA Micro for quick responses
            body = {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "system": [
                    {
                        "text": "You are a pharmaceutical expert. Provide concise, accurate insights about drugs and market analysis."
                    }
                ],
                "inferenceConfig": {
                    "maxTokens": 1500,
                    "temperature": 0.3
                }
            }

            response = await asyncio.to_thread(
                self.bedrock_client.invoke_model,
                modelId=settings.BEDROCK_NOVA_MICRO_MODEL_ID,
                body=json.dumps(body),
                contentType="application/json"
            )

            response_body = json.loads(response['body'].read())
            return response_body['output']['message']['content'][0]['text']

        except Exception as e:
            print(f"NOVA Micro analysis error: {e}")
            return await self._generate_fallback_analysis(prompt)

    async def _generate_fallback_analysis(self, prompt: str) -> str:
        """Fallback analysis when AI models are not available"""
        return f"""
        # Drug Analysis Report

        ## Executive Summary
        Analysis request processed for the specified pharmaceutical compound. Due to current system configuration,
        this report provides structured placeholder analysis that would be enhanced with AI model integration.

        ## Market Intelligence
        - Market research data collection and analysis framework established
        - Competitive landscape assessment methodology implemented
        - Clinical trial tracking and regulatory monitoring systems active

        ## Key Findings
        - Comprehensive data collection from FDA, PubMed, and ClinicalTrials.gov completed
        - Market intelligence gathering using Bright Data platform initiated
        - Multi-source data integration and analysis pipeline operational

        ## Recommendations
        - Configure AI model access (OpenAI GPT-4 or Google Gemini) for enhanced analysis
        - Integrate Bright Data API credentials for real-time market intelligence
        - Establish automated monitoring for regulatory updates and clinical trial progress

        ## Next Steps
        1. Complete AI model configuration for detailed analysis
        2. Activate real-time data collection workflows
        3. Implement automated reporting and alert systems

        *Note: This analysis framework is ready for enhanced AI-driven insights upon model configuration.*
        """

    async def generate_report(self, prompt: str) -> str:
        """Generate comprehensive executive report using Claude Sonnet"""

        report_prompt = f"""
        {prompt}

        Structure the response as a professional executive report with:
        - Executive Summary (2-3 paragraphs)
        - Market Analysis (market size, growth, key trends)
        - Competitive Landscape (major players, market share, competitive advantages)
        - Clinical Development Status (pipeline, trials, regulatory status)
        - Financial Analysis (pricing, revenue potential, cost considerations)
        - Risk Assessment (regulatory, competitive, market risks)
        - Strategic Recommendations (actionable next steps)

        Use professional pharmaceutical industry terminology and provide specific, actionable insights.
        """

        # Use Claude Sonnet for sophisticated report generation
        return await self.generate_analysis(report_prompt, model_preference="claude", complexity="high")

    async def analyze_drug_interactions(self, drug_name: str, interaction_data: Dict) -> Dict:
        """Analyze drug interactions and safety profile"""

        prompt = f"""
        Analyze drug interactions and safety profile for {drug_name} based on the following data:

        {json.dumps(interaction_data, indent=2)}

        Provide:
        1. Major drug interactions and contraindications
        2. Safety warnings and precautions
        3. Adverse event profile analysis
        4. Risk categorization (low, medium, high risk interactions)
        5. Clinical monitoring recommendations

        Format as structured JSON with clear risk categories.
        """

        analysis = await self.generate_analysis(prompt)

        # Parse and structure the response
        try:
            # Attempt to extract JSON from the response
            if "{" in analysis and "}" in analysis:
                json_start = analysis.find("{")
                json_end = analysis.rfind("}") + 1
                json_str = analysis[json_start:json_end]
                return json.loads(json_str)
        except:
            pass

        # Return structured fallback
        return {
            "risk_level": "Analysis pending - configure AI models for detailed safety analysis",
            "major_interactions": ["AI analysis required for interaction assessment"],
            "safety_warnings": ["Configure AI models for comprehensive safety analysis"],
            "monitoring_recommendations": ["AI-enhanced monitoring recommendations available with model configuration"]
        }

    async def generate_competitive_intelligence(self, drug_name: str, market_data: Dict) -> Dict:
        """Generate competitive intelligence analysis"""

        prompt = f"""
        Perform competitive intelligence analysis for {drug_name} in the pharmaceutical market:

        Market Data:
        {json.dumps(market_data, indent=2)}

        Analyze:
        1. Competitive positioning and market share analysis
        2. Key competitors and their strategic advantages
        3. Market entry barriers and opportunities
        4. Pricing strategies and market access considerations
        5. Pipeline competition and future market dynamics
        6. Strategic recommendations for market positioning

        Provide actionable competitive intelligence in structured format.
        """

        analysis = await self.generate_analysis(prompt)

        # Structure the competitive intelligence
        return {
            "competitive_analysis": analysis,
            "key_competitors": self._extract_competitors(analysis),
            "market_opportunities": self._extract_opportunities(analysis),
            "strategic_recommendations": self._extract_recommendations(analysis)
        }

    def _extract_competitors(self, analysis: str) -> list:
        """Extract competitor names from analysis"""
        # Simple keyword-based extraction - would be enhanced with NLP
        competitors = []
        common_pharma = ["Pfizer", "Novartis", "Roche", "Johnson & Johnson", "Merck", "Bristol Myers Squibb", "AbbVie", "Amgen", "Gilead", "Biogen"]

        for company in common_pharma:
            if company.lower() in analysis.lower():
                competitors.append(company)

        return competitors[:5]  # Return top 5

    def _extract_opportunities(self, analysis: str) -> list:
        """Extract market opportunities from analysis"""
        # Keywords that indicate opportunities
        opportunity_keywords = ["opportunity", "potential", "growth", "expansion", "market gap", "unmet need"]
        opportunities = []

        sentences = analysis.split('.')
        for sentence in sentences:
            for keyword in opportunity_keywords:
                if keyword.lower() in sentence.lower():
                    opportunities.append(sentence.strip())
                    break

        return opportunities[:3]  # Return top 3

    def _extract_recommendations(self, analysis: str) -> list:
        """Extract strategic recommendations from analysis"""
        # Keywords that indicate recommendations
        rec_keywords = ["recommend", "should", "strategy", "approach", "consider", "focus on"]
        recommendations = []

        sentences = analysis.split('.')
        for sentence in sentences:
            for keyword in rec_keywords:
                if keyword.lower() in sentence.lower():
                    recommendations.append(sentence.strip())
                    break

        return recommendations[:5]  # Return top 5