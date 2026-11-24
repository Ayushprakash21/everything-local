import fs from 'fs';
import path from 'path';

export interface ImageAuditIssue {
  productId: string;
  productName: string;
  category: string;
  imageUrl: string | null;
  issueType: 'MISSING_IMAGE' | 'BROKEN_ASSET' | 'UNRELATED_DUPLICATE' | 'SEMANTIC_MISMATCH';
  details: string;
}

export interface ImageAuditSummary {
  totalAudited: number;
  validCount: number;
  invalidCount: number;
  uniqueImagesCount: number;
  duplicatesAcrossUnrelated: number;
  missingCount: number;
  brokenCount: number;
  semanticMismatchCount: number;
  isCatalogueCompliant: boolean;
  issues: ImageAuditIssue[];
}

export class ProductImageValidator {
  private static readonly ASSETS_DIR = path.resolve(__dirname, '../../../client/public');

  /**
   * Semantic keywords mapped to canonical image file stems
   */
  private static readonly RELEVANCE_RULES: Array<{
    filePattern: RegExp;
    allowedKeywords: string[];
    forbiddenKeywords: string[];
  }> = [
    {
      filePattern: /sugar/i,
      allowedKeywords: ['sugar', 'cheeni', 'shakkar', 'madhur'],
      forbiddenKeywords: ['atta', 'flour', 'dal', 'rice', 'oil', 'potato', 'onion', 'bread', 'butter', 'milk', 'salt']
    },
    {
      filePattern: /atta|wheat/i,
      allowedKeywords: ['atta', 'flour', 'wheat', 'gehun', 'chakki', 'aashirvaad'],
      forbiddenKeywords: ['sugar', 'dal', 'rice', 'oil', 'salt', 'butter', 'milk']
    },
    {
      filePattern: /rice|basmati/i,
      allowedKeywords: ['rice', 'basmati', 'chawal', 'rozzana', 'biryani'],
      forbiddenKeywords: ['sugar', 'atta', 'dal', 'oil', 'salt', 'bread']
    },
    {
      filePattern: /toor-dal/i,
      allowedKeywords: ['toor', 'arhar', 'pigeon pea'],
      forbiddenKeywords: ['moong', 'chana', 'masoor', 'rajma', 'sugar', 'atta']
    },
    {
      filePattern: /moong-dal/i,
      allowedKeywords: ['moong', 'green gram', 'dhuli'],
      forbiddenKeywords: ['toor', 'chana', 'masoor', 'rajma', 'sugar']
    },
    {
      filePattern: /chana-dal/i,
      allowedKeywords: ['chana dal', 'bengal gram'],
      forbiddenKeywords: ['toor', 'moong', 'masoor', 'sugar']
    },
    {
      filePattern: /masoor-dal/i,
      allowedKeywords: ['masoor', 'red lentil', 'malka'],
      forbiddenKeywords: ['toor', 'moong', 'chana', 'rajma', 'sugar']
    },
    {
      filePattern: /rajma/i,
      allowedKeywords: ['rajma', 'kidney bean'],
      forbiddenKeywords: ['chana', 'dal', 'sugar', 'atta']
    },
    {
      filePattern: /kabuli-chana/i,
      allowedKeywords: ['kabuli', 'chickpea', 'chole'],
      forbiddenKeywords: ['sugar', 'atta', 'rajma']
    },
    {
      filePattern: /poha/i,
      allowedKeywords: ['poha', 'flattened rice', 'ujjayini'],
      forbiddenKeywords: ['sugar', 'atta', 'dal']
    },
    {
      filePattern: /sooji|rava/i,
      allowedKeywords: ['sooji', 'suji', 'rava', 'semolina'],
      forbiddenKeywords: ['sugar', 'rice', 'dal']
    },
    {
      filePattern: /besan/i,
      allowedKeywords: ['besan', 'gram flour'],
      forbiddenKeywords: ['sugar', 'wheat', 'sooji']
    },
    {
      filePattern: /sunflower-oil/i,
      allowedKeywords: ['sunflower', 'cooking oil', 'sunlite'],
      forbiddenKeywords: ['mustard', 'ghee', 'sugar', 'atta']
    },
    {
      filePattern: /mustard-oil/i,
      allowedKeywords: ['mustard', 'kachi ghani', 'sarson'],
      forbiddenKeywords: ['sunflower', 'ghee', 'sugar']
    },
    {
      filePattern: /ghee/i,
      allowedKeywords: ['ghee', 'cow ghee', 'clarified butter'],
      forbiddenKeywords: ['sunflower', 'mustard', 'sugar']
    },
    {
      filePattern: /salt/i,
      allowedKeywords: ['salt', 'namak', 'tata salt'],
      forbiddenKeywords: ['sugar', 'atta', 'oil', 'bread']
    },
    {
      filePattern: /potato/i,
      allowedKeywords: ['potato', 'potatoes', 'aloo', 'malwa potato'],
      forbiddenKeywords: ['onion', 'tomato', 'sugar', 'apple']
    },
    {
      filePattern: /onion/i,
      allowedKeywords: ['onion', 'onions', 'pyaz'],
      forbiddenKeywords: ['potato', 'tomato', 'sugar']
    },
    {
      filePattern: /tomato/i,
      allowedKeywords: ['tomato', 'tomatoes', 'tamatar'],
      forbiddenKeywords: ['potato', 'onion', 'sugar']
    },
    {
      filePattern: /apple/i,
      allowedKeywords: ['apple', 'apples', 'seb', 'shimla'],
      forbiddenKeywords: ['mango', 'banana', 'potato', 'sugar']
    },
    {
      filePattern: /mango/i,
      allowedKeywords: ['mango', 'mangoes', 'aam', 'alphonso'],
      forbiddenKeywords: ['apple', 'banana', 'sugar']
    },
    {
      filePattern: /banana/i,
      allowedKeywords: ['banana', 'bananas', 'kela', 'robusta'],
      forbiddenKeywords: ['apple', 'mango', 'sugar']
    },
    {
      filePattern: /bread/i,
      allowedKeywords: ['bread', 'loaf', 'multigrain loaf'],
      forbiddenKeywords: ['butter', 'milk', 'sugar', 'atta']
    },
    {
      filePattern: /butter/i,
      allowedKeywords: ['butter', 'makhan', 'amul butter'],
      forbiddenKeywords: ['bread', 'milk', 'sugar']
    },
    {
      filePattern: /milk/i,
      allowedKeywords: ['milk', 'doodh', 'sanchi gold'],
      forbiddenKeywords: ['bread', 'butter', 'sugar']
    },
    {
      filePattern: /paneer/i,
      allowedKeywords: ['paneer', 'cottage cheese'],
      forbiddenKeywords: ['butter', 'milk', 'bread']
    },
    {
      filePattern: /egg/i,
      allowedKeywords: ['egg', 'eggs', 'anda'],
      forbiddenKeywords: ['milk', 'paneer', 'bread']
    }
  ];

  /**
   * Validates a single product's image relevance against its name.
   */
  public static validateProductImageRelevance(productName: string, imageUrl: string | null): {
    isValid: boolean;
    reason?: string;
  } {
    if (!imageUrl || imageUrl.trim() === '') {
      return { isValid: false, reason: 'Image URL is missing' };
    }

    const pName = productName.toLowerCase();

    for (const rule of this.RELEVANCE_RULES) {
      if (rule.filePattern.test(imageUrl)) {
        // Check if forbidden keyword appears in product name
        const forbiddenMatch = rule.forbiddenKeywords.find((kw) => pName.includes(kw));
        if (forbiddenMatch) {
          return {
            isValid: false,
            reason: `Image file ${imageUrl} does not match product '${productName}' (found forbidden mismatch: '${forbiddenMatch}')`
          };
        }

        // Check if at least one allowed keyword appears in product name
        const allowedMatch = rule.allowedKeywords.some((kw) => pName.includes(kw));
        if (!allowedMatch) {
          return {
            isValid: false,
            reason: `Image file ${imageUrl} requires allowed keyword (${rule.allowedKeywords.join(', ')}) but found '${productName}'`
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Checks whether the asset exists on disk and is non-empty.
   */
  public static verifyAssetExistsOnDisk(imageUrl: string | null): boolean {
    if (!imageUrl || imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return true; // External URL or empty
    }
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    const fullPath = path.join(this.ASSETS_DIR, cleanPath);
    if (!fs.existsSync(fullPath)) return false;
    const stats = fs.statSync(fullPath);
    return stats.size > 500;
  }

  /**
   * Audits a collection of products for missing images, broken assets,
   * semantic relevance mismatches, and duplicates across unrelated items.
   */
  public static auditCatalogue(products: Array<{ id: string; name: string; category: string; imageUrl: string | null }>): ImageAuditSummary {
    const issues: ImageAuditIssue[] = [];
    const imageToProductsMap = new Map<string, Array<{ id: string; name: string; category: string }>>();

    let missingCount = 0;
    let brokenCount = 0;
    let semanticMismatchCount = 0;

    for (const p of products) {
      // 1. Missing check
      if (!p.imageUrl || p.imageUrl.trim() === '') {
        missingCount++;
        issues.push({
          productId: p.id,
          productName: p.name,
          category: p.category,
          imageUrl: null,
          issueType: 'MISSING_IMAGE',
          details: 'Product has no image URL assigned'
        });
        continue;
      }

      // 2. Broken asset check
      const exists = this.verifyAssetExistsOnDisk(p.imageUrl);
      if (!exists) {
        brokenCount++;
        issues.push({
          productId: p.id,
          productName: p.name,
          category: p.category,
          imageUrl: p.imageUrl,
          issueType: 'BROKEN_ASSET',
          details: `Image file does not exist on disk: ${p.imageUrl}`
        });
      }

      // 3. Semantic relevance check
      const relevance = this.validateProductImageRelevance(p.name, p.imageUrl);
      if (!relevance.isValid) {
        semanticMismatchCount++;
        issues.push({
          productId: p.id,
          productName: p.name,
          category: p.category,
          imageUrl: p.imageUrl,
          issueType: 'SEMANTIC_MISMATCH',
          details: relevance.reason || 'Semantic mismatch'
        });
      }

      // Group by image for duplicate detection across unrelated products
      const list = imageToProductsMap.get(p.imageUrl) || [];
      list.push(p);
      imageToProductsMap.set(p.imageUrl, list);
    }

    // 4. Duplicate check across unrelated products
    let duplicatesAcrossUnrelated = 0;
    for (const [imgUrl, prods] of imageToProductsMap.entries()) {
      if (prods.length > 1) {
        // If the product names are genuinely different products sharing the same image
        const normalizedNames = new Set(prods.map((p) => p.name.toLowerCase().trim()));
        if (normalizedNames.size > 1) {
          duplicatesAcrossUnrelated += prods.length;
          for (const p of prods) {
            issues.push({
              productId: p.id,
              productName: p.name,
              category: p.category,
              imageUrl: imgUrl,
              issueType: 'UNRELATED_DUPLICATE',
              details: `Image is shared across ${prods.length} unrelated products: ${Array.from(normalizedNames).join(', ')}`
            });
          }
        }
      }
    }

    const totalAudited = products.length;
    const invalidCount = issues.length;
    const validCount = Math.max(0, totalAudited - invalidCount);
    const uniqueImagesCount = imageToProductsMap.size;
    const isCatalogueCompliant = issues.length === 0;

    return {
      totalAudited,
      validCount,
      invalidCount,
      uniqueImagesCount,
      duplicatesAcrossUnrelated,
      missingCount,
      brokenCount,
      semanticMismatchCount,
      isCatalogueCompliant,
      issues
    };
  }
}
