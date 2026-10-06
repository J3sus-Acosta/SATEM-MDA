export interface ConditionNode {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'in' | 'gt' | 'lt';
  value: any;
}

export interface ConditionTree {
  all?: (ConditionNode | ConditionTree)[];
  any?: (ConditionNode | ConditionTree)[];
}

export interface RuleAction {
  type: 'SET_PRIORITY' | 'ASSIGN_GROUP' | 'ASSIGN_USER' | 'ADD_TAG' | 'SET_STATUS';
  value: any;
}

export interface WorkflowRuleDefinition {
  id: string;
  name: string;
  eventType: string;
  conditions: ConditionTree;
  actions: RuleAction[];
  executionOrder?: number;
}

export class WorkflowRuleEngine {
  private maxDepth: number;

  constructor(maxDepth: number = 3) {
    this.maxDepth = maxDepth;
  }

  evaluateCondition(node: ConditionNode, context: Record<string, any>): boolean {
    const contextValue = context[node.field];

    switch (node.operator) {
      case 'eq':
        return contextValue === node.value;
      case 'neq':
        return contextValue !== node.value;
      case 'contains':
        return typeof contextValue === 'string' && contextValue.includes(node.value);
      case 'in':
        return Array.isArray(node.value) && node.value.includes(contextValue);
      case 'gt':
        return contextValue > node.value;
      case 'lt':
        return contextValue < node.value;
      default:
        return false;
    }
  }

  evaluateConditionTree(tree: ConditionTree, context: Record<string, any>): boolean {
    if (tree.all && tree.all.length > 0) {
      const allPassed = tree.all.every((item) =>
        'operator' in item
          ? this.evaluateCondition(item as ConditionNode, context)
          : this.evaluateConditionTree(item as ConditionTree, context)
      );
      if (!allPassed) return false;
    }

    if (tree.any && tree.any.length > 0) {
      const anyPassed = tree.any.some((item) =>
        'operator' in item
          ? this.evaluateCondition(item as ConditionNode, context)
          : this.evaluateConditionTree(item as ConditionTree, context)
      );
      if (!anyPassed) return false;
    }

    return true;
  }

  async executeRules(
    rules: WorkflowRuleDefinition[],
    context: Record<string, any>,
    currentDepth: number = 0
  ): Promise<{ appliedRules: string[]; updatedContext: Record<string, any> }> {
    if (currentDepth >= this.maxDepth) {
      console.warn(`[WorkflowRuleEngine] Profundidad máxima alcanzada (${this.maxDepth}). Previniendo bucle infinito.`);
      return { appliedRules: [], updatedContext: context };
    }

    const appliedRules: string[] = [];
    let updatedContext = { ...context };

    // Ordenar reglas por executionOrder
    const sortedRules = [...rules].sort((a, b) => (a.executionOrder || 0) - (b.executionOrder || 0));

    for (const rule of sortedRules) {
      const isMatch = this.evaluateConditionTree(rule.conditions, updatedContext);
      if (isMatch) {
        appliedRules.push(rule.id);
        // Aplicar acciones
        for (const action of rule.actions) {
          switch (action.type) {
            case 'SET_PRIORITY':
              updatedContext.priority = action.value;
              break;
            case 'ASSIGN_GROUP':
              updatedContext.groupId = action.value;
              break;
            case 'ASSIGN_USER':
              updatedContext.assigneeId = action.value;
              break;
            case 'SET_STATUS':
              updatedContext.status = action.value;
              break;
            case 'ADD_TAG':
              updatedContext.tags = [...(updatedContext.tags || []), action.value];
              break;
          }
        }
      }
    }

    return { appliedRules, updatedContext };
  }
}

export const workflowRuleEngine = new WorkflowRuleEngine();
