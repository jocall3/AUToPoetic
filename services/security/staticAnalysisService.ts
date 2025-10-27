/**
 * @file Provides a client-side static code analysis service to identify potential security vulnerabilities.
 * @module services/security/staticAnalysisService
 * @see SecurityScanner.tsx
 * @description
 * This service implements a basic static analysis engine using a set of predefined rules.
 * It is designed to be extensible, allowing new security rules to be added easily by following the Strategy pattern.
 * Each rule is an independent strategy that scans code for a specific vulnerability pattern.
 * The primary function, `runStaticScan`, orchestrates the application of these rules to a given code snippet.
 *
 * @security This module performs security-related checks. The rules are based on regular expressions
 * and represent a first-pass, non-comprehensive security scan. It should not be solely relied upon for
 * production security validation but serves as a helpful developer tool to catch common issues early.
 *
 * @performance The scanning process iterates through each line of the input code for every registered rule.
 * For very large code snippets, this could be computationally intensive. Future optimizations should offload
 * this entire process to a Web Worker to avoid blocking the main thread, as per architectural directives.
 * The `runStaticScan` method is already async to facilitate this transition.
 */

//================================================================================
// SECTION: Domain Models and Interfaces
// Defines the core data structures and contracts for the static analysis service.
//================================================================================

/**
 * @interface SecurityIssue
 * @description Represents a single security issue identified by a security rule.
 * @property {number} line - The line number where the issue was detected.
 * @property {string} type - The type or name of the vulnerability (e.g., 'Hardcoded Secret').
 * @property {string} description - A human-readable description of the issue and its potential impact.
 * @property {'Critical' | 'High' | 'Medium' | 'Low'} severity - The assessed severity of the issue.
 * @property {string} ruleId - The unique identifier of the rule that detected the issue.
 * @property {string} [codeExtract] - A snippet of the code line where the issue was found.
 */
export interface SecurityIssue {
  line: number;
  type: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  ruleId: string;
  codeExtract?: string;
}

/**
 * @interface ISecurityRule
 * @description Defines the contract for a static analysis rule (Strategy pattern).
 * Each rule is responsible for scanning a line of code for a specific vulnerability.
 * @property {string} id - A unique identifier for the rule (e.g., 'hardcoded-secret-rule').
 * @property {string} name - A human-readable name for the rule (e.g., 'Hardcoded Secret').
 * @property {string} description - A detailed description of the vulnerability the rule checks for.
 * @property {'Critical' | 'High' | 'Medium' | 'Low'} severity - The severity of the issue this rule detects.
 * @method execute - Scans a single line of code and returns an array of `SecurityIssue` if any are found.
 */
export interface ISecurityRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly severity: 'Critical' | 'High' | 'Medium' | 'Low';
  
  /**
   * Executes the rule against a given line of code.
   * @param {string} line - The line of code to analyze.
   * @param {number} lineNumber - The line number in the source file.
   * @returns {SecurityIssue[]} An array of security issues found on this line, or an empty array if none.
   */
  execute(line: string, lineNumber: number): SecurityIssue[];
}

//================================================================================
// SECTION: Rule Implementations (Strategies)
// Concrete implementations of the ISecurityRule interface.
//================================================================================

/**
 * @class RegexRule
 * @description An abstract base class for rules that operate using a single regular expression.
 * Simplifies the creation of new regex-based rules.
 * @implements {ISecurityRule}
 */
abstract class RegexRule implements ISecurityRule {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly severity: 'Critical' | 'High' | 'Medium' | 'Low';
  protected abstract readonly regex: RegExp;

  /**
   * @inheritdoc
   * @example
   * const rule = new HardcodedSecretRule();
   * const issues = rule.execute("const API_KEY = '...';", 1);
   * // issues might contain a SecurityIssue object.
   */
  public execute(line: string, lineNumber: number): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    // Ensure the regex has the global flag to find all matches with `matchAll`.
    if (!this.regex.global) {
        console.warn(`RegexRule '${this.id}' is not using a global regex, which may miss multiple matches on a single line.`);
    }

    const matches = line.matchAll(this.regex);
    for (const match of matches) {
      issues.push({
        line: lineNumber,
        type: this.name,
        description: this.description,
        severity: this.severity,
        ruleId: this.id,
        codeExtract: match[0].trim(),
      });
    }
    return issues;
  }
}

/** @description Rule to detect potentially hardcoded secrets, keys, or tokens. */
class HardcodedSecretRule extends RegexRule {
  readonly id = 'hardcoded-secret';
  readonly name = 'Hardcoded Secret';
  readonly description = 'A hardcoded secret, API key, token, or password was found. These should be stored in environment variables or a secure vault.';
  readonly severity = 'High';
  protected readonly regex = /(key|secret|token|password|auth_token|api_key)['"]?\s*[:=]\s*['"]([a-zA-Z0-9-_.]{20,})['"]/gi;
}

/** @description Rule to detect the use of `dangerouslySetInnerHTML`, which can lead to XSS vulnerabilities. */
class DangerouslySetInnerHTMLRule extends RegexRule {
  readonly id = 'dangerously-set-inner-html';
  readonly name = 'dangerouslySetInnerHTML Usage';
  readonly description = 'Use of dangerouslySetInnerHTML can open your application to Cross-Site Scripting (XSS) attacks. Ensure the source HTML is properly sanitized.';
  readonly severity = 'Medium';
  protected readonly regex = /dangerouslySetInnerHTML/g;
}

/** @description Rule to detect the use of `eval()`, which can execute arbitrary code. */
class EvalUsageRule extends RegexRule {
  readonly id = 'eval-usage';
  readonly name = 'eval() Usage';
  readonly description = 'The use of eval() is a major security risk as it can execute arbitrary code passed to it. Avoid its use entirely.';
  readonly severity = 'High';
  protected readonly regex = /\beval\s*\(/g;
}

/** @description Rule to detect insecure `http://` URLs, which can be subject to man-in-the-middle attacks. */
class InsecureUrlRule extends RegexRule {
  readonly id = 'insecure-url';
  readonly name = 'Insecure URL';
  readonly description = 'Found an insecure "http://" URL. Use "https://" for all external resources to ensure data is encrypted in transit.';
  readonly severity = 'Low';
  // This regex avoids matching localhost or local IPs.
  protected readonly regex = /http:\/\/(?!localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})[^\s'"]+/g;
}

//================================================================================
// SECTION: Service Implementation
// The main service class that orchestrates the scanning process.
//================================================================================

/**
 * @class StaticAnalysisService
 * @description A service to perform static security analysis on code snippets.
 * This class is designed to be injectable in a Dependency Injection container.
 *
 * @example
 * const analysisService = new StaticAnalysisService();
 * const code = "const API_KEY = '...';";
 * const issues = await analysisService.runStaticScan(code);
 * console.log(issues);
 */
export class StaticAnalysisService {
  private readonly rules: ISecurityRule[];

  /**
   * Creates an instance of StaticAnalysisService.
   * @param {ISecurityRule[]} [rules] - An optional array of security rules to use. If not provided, a default set is used.
   * This allows for dependency injection of the rules, making the service highly configurable and testable.
   */
  constructor(rules?: ISecurityRule[]) {
    this.rules = rules || [
      new HardcodedSecretRule(),
      new DangerouslySetInnerHTMLRule(),
      new EvalUsageRule(),
      new InsecureUrlRule(),
    ];
  }

  /**
   * Runs a static security scan on a given block of code.
   * The method is asynchronous to prepare for future offloading to a Web Worker,
   * which will prevent blocking the main UI thread during analysis of large files.
   *
   * @param {string} code - The code snippet to scan for vulnerabilities.
   * @returns {Promise<SecurityIssue[]>} A promise that resolves to an array of found security issues.
   *
   * @performance For large code inputs, this operation can be CPU-intensive. It's designed
   * to be moved to a worker thread. The current implementation uses a `Promise.resolve` to
   * maintain an async interface without actual async work.
   *
   * @example
   * const service = new StaticAnalysisService();
   * const code = "eval('alert(1)');";
   * service.runStaticScan(code).then(issues => {
   *   console.log(issues);
   *   // Expected output: [{ line: 1, type: 'eval() Usage', ... }]
   * });
   */
  public async runStaticScan(code: string): Promise<SecurityIssue[]> {
    return new Promise((resolve) => {
      if (!code) {
        resolve([]);
        return;
      }
      
      const issues: SecurityIssue[] = [];
      const lines = code.split('\n');

      lines.forEach((line, index) => {
        for (const rule of this.rules) {
          const foundIssues = rule.execute(line, index + 1);
          if (foundIssues.length > 0) {
            issues.push(...foundIssues);
          }
        }
      });
      
      resolve(issues);
    });
  }
}

/**
 * A singleton instance of the StaticAnalysisService for easy, non-DI use.
 * In a DI-based architecture, you would register the `StaticAnalysisService` class
 * with your container instead of using this instance directly.
 */
const staticAnalysisService = new StaticAnalysisService();

/**
 * A convenience function that uses the singleton instance of `StaticAnalysisService`.
 * @param {string} code - The code to scan.
 * @returns {Promise<SecurityIssue[]>} A promise that resolves with the found issues.
 * @see StaticAnalysisService.runStaticScan
 */
export const runStaticScan = (code: string): Promise<SecurityIssue[]> => {
    return staticAnalysisService.runStaticScan(code);
};
