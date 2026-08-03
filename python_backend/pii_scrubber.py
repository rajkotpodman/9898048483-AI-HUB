import re
import spacy

try:
    # Try loading the small english model
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading spacy model 'en_core_web_sm'...")
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def sanitize_prompt(text: str) -> str:
    """
    Sanitizes a text prompt by masking potential API keys, passwords,
    email addresses, and PII using both regex and NLP.
    """
    # 1. Mask API keys, passwords, and typical secrets using regex
    # Common JWT or API key pattern
    key_pattern = re.compile(r'(?i)(api[_-]?key|secret|password|token)\s*[:=]\s*["\']?[a-zA-Z0-9\-_]{16,}["\']?')
    text = key_pattern.sub(r'\1: [REDACTED_SECRET]', text)
    
    # 2. Mask emails
    email_pattern = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
    text = email_pattern.sub('[REDACTED_EMAIL]', text)
    
    # 3. Mask PII using spacy (Names, Organizations, Locations)
    doc = nlp(text)
    sanitized = text
    
    # Iterate backwards to avoid index shifting during replacement
    for ent in reversed(doc.ents):
        if ent.label_ in ['PERSON', 'ORG', 'GPE', 'LOC', 'PHONE']:
            sanitized = sanitized[:ent.start_char] + f'[REDACTED_{ent.label_}]' + sanitized[ent.end_char:]
            
    return sanitized

if __name__ == "__main__":
    # Test the scrubber
    test_str = "My name is John Doe from Acme Corp. My secret_token=abcdef1234567890xyz and email is john@acme.com."
    print("Original:", test_str)
    print("Sanitized:", sanitize_prompt(test_str))
