/**
 * Power Lunch Category System
 * 
 * Hierarchical categories for organizing expertise and sessions.
 * Categories are organized as: Main Category > Subcategory
 */

export interface Subcategory {
    id: string
    label: string
    icon?: string
}

export interface Category {
    id: string
    label: string
    icon: string
    color: string
    description: string
    subcategories: Subcategory[]
}

export const categories: Category[] = [
    {
        id: 'language',
        label: 'Language & Communication',
        icon: 'fa-language',
        color: 'bg-blue-100 text-blue-600',
        description: 'Learn or practice any language',
        subcategories: [
            { id: 'english', label: 'English' },
            { id: 'japanese', label: 'Japanese (日本語)' },
            { id: 'chinese', label: 'Chinese (中文)' },
            { id: 'korean', label: 'Korean (한국어)' },
            { id: 'spanish', label: 'Spanish (Español)' },
            { id: 'french', label: 'French (Français)' },
            { id: 'german', label: 'German (Deutsch)' },
            { id: 'other_language', label: 'Other Languages' },
            { id: 'public_speaking', label: 'Public Speaking' },
            { id: 'writing', label: 'Writing & Editing' },
        ]
    },
    {
        id: 'technology',
        label: 'Technology & Programming',
        icon: 'fa-laptop-code',
        color: 'bg-purple-100 text-purple-600',
        description: 'Coding, software, and tech skills',
        subcategories: [
            { id: 'web_dev', label: 'Web Development' },
            { id: 'mobile_dev', label: 'Mobile Development' },
            { id: 'python', label: 'Python' },
            { id: 'javascript', label: 'JavaScript/TypeScript' },
            { id: 'data_science', label: 'Data Science & ML' },
            { id: 'cloud', label: 'Cloud & DevOps' },
            { id: 'cybersecurity', label: 'Cybersecurity' },
            { id: 'blockchain', label: 'Blockchain & Web3' },
            { id: 'ai', label: 'AI & Automation' },
            { id: 'other_tech', label: 'Other Tech Topics' },
        ]
    },
    {
        id: 'business',
        label: 'Business & Entrepreneurship',
        icon: 'fa-briefcase',
        color: 'bg-green-100 text-green-600',
        description: 'Startups, management, and strategy',
        subcategories: [
            { id: 'startup', label: 'Startup Advice' },
            { id: 'fundraising', label: 'Fundraising & VC' },
            { id: 'marketing', label: 'Marketing & Growth' },
            { id: 'sales', label: 'Sales & Negotiation' },
            { id: 'product', label: 'Product Management' },
            { id: 'leadership', label: 'Leadership & Management' },
            { id: 'finance', label: 'Finance & Accounting' },
            { id: 'legal_business', label: 'Business Law & Contracts' },
            { id: 'ecommerce', label: 'E-commerce' },
            { id: 'consulting', label: 'Consulting' },
        ]
    },
    {
        id: 'creative',
        label: 'Creative & Design',
        icon: 'fa-palette',
        color: 'bg-orange-100 text-orange-600',
        description: 'Art, design, and creative skills',
        subcategories: [
            { id: 'ui_ux', label: 'UI/UX Design' },
            { id: 'graphic_design', label: 'Graphic Design' },
            { id: 'architecture', label: 'Architecture' },
            { id: 'interior_design', label: 'Interior Design' },
            { id: 'illustration', label: 'Illustration' },
            { id: 'photography', label: 'Photography' },
            { id: 'video', label: 'Video & Film' },
            { id: 'animation', label: 'Animation & Motion' },
            { id: 'music', label: 'Music & Audio' },
            { id: 'writing_creative', label: 'Creative Writing' },
            { id: 'game_design', label: 'Game Design' },
            { id: 'fashion', label: 'Fashion Design' },
        ]
    },
    {
        id: 'career',
        label: 'Career & Professional',
        icon: 'fa-user-tie',
        color: 'bg-indigo-100 text-indigo-600',
        description: 'Career guidance and professional growth',
        subcategories: [
            { id: 'career_advice', label: 'Career Advice' },
            { id: 'resume', label: 'Resume & Portfolio Review' },
            { id: 'interview_prep', label: 'Interview Preparation' },
            { id: 'job_search', label: 'Job Search Strategy' },
            { id: 'networking', label: 'Networking Tips' },
            { id: 'freelancing', label: 'Freelancing' },
            { id: 'remote_work', label: 'Remote Work' },
            { id: 'salary', label: 'Salary Negotiation' },
            { id: 'career_change', label: 'Career Transition' },
            { id: 'work_visa', label: 'Work Visa & Immigration' },
        ]
    },
    {
        id: 'education',
        label: 'Education & Academic',
        icon: 'fa-graduation-cap',
        color: 'bg-yellow-100 text-yellow-700',
        description: 'Academic subjects and test preparation',
        subcategories: [
            { id: 'math', label: 'Mathematics' },
            { id: 'science', label: 'Science' },
            { id: 'physics', label: 'Physics' },
            { id: 'chemistry', label: 'Chemistry' },
            { id: 'biology', label: 'Biology' },
            { id: 'economics', label: 'Economics' },
            { id: 'history', label: 'History' },
            { id: 'test_prep', label: 'Test Prep (SAT/GMAT/etc)' },
            { id: 'study_abroad', label: 'Study Abroad Guidance' },
            { id: 'research', label: 'Research & Academia' },
        ]
    },
    {
        id: 'lifestyle',
        label: 'Lifestyle & Hobbies',
        icon: 'fa-heart',
        color: 'bg-pink-100 text-pink-600',
        description: 'Personal interests and life skills',
        subcategories: [
            { id: 'cooking', label: 'Cooking & Cuisine' },
            { id: 'fitness', label: 'Fitness & Health' },
            { id: 'travel', label: 'Travel Planning' },
            { id: 'parenting', label: 'Parenting' },
            { id: 'relationships', label: 'Relationships & Dating' },
            { id: 'mindfulness', label: 'Mindfulness & Meditation' },
            { id: 'personal_finance', label: 'Personal Finance' },
            { id: 'home', label: 'Home & DIY' },
            { id: 'gardening', label: 'Gardening' },
            { id: 'pets', label: 'Pet Care' },
        ]
    },
    {
        id: 'culture',
        label: 'Culture & Society',
        icon: 'fa-globe',
        color: 'bg-teal-100 text-teal-600',
        description: 'Culture, customs, and social topics',
        subcategories: [
            { id: 'cultural_exchange', label: 'Cultural Exchange' },
            { id: 'expat_life', label: 'Expat & Immigrant Life' },
            { id: 'local_guide', label: 'Local City Guide' },
            { id: 'traditions', label: 'Traditions & Customs' },
            { id: 'food_culture', label: 'Food Culture' },
            { id: 'festivals', label: 'Festivals & Events' },
            { id: 'religion', label: 'Religion & Spirituality' },
            { id: 'social_issues', label: 'Social Issues' },
            { id: 'volunteering', label: 'Volunteering & NGO' },
            { id: 'diversity', label: 'Diversity & Inclusion' },
        ]
    },
]

// Helper functions
export function getCategoryById(id: string): Category | undefined {
    return categories.find(cat => cat.id === id)
}

export function getSubcategoryById(categoryId: string, subcategoryId: string): Subcategory | undefined {
    const category = getCategoryById(categoryId)
    return category?.subcategories.find(sub => sub.id === subcategoryId)
}

export function getAllSubcategories(): { categoryId: string; categoryLabel: string; subcategory: Subcategory }[] {
    const result: { categoryId: string; categoryLabel: string; subcategory: Subcategory }[] = []
    for (const category of categories) {
        for (const subcategory of category.subcategories) {
            result.push({
                categoryId: category.id,
                categoryLabel: category.label,
                subcategory
            })
        }
    }
    return result
}

export function formatCategoryDisplay(categoryId: string, subcategoryId?: string): string {
    const category = getCategoryById(categoryId)
    if (!category) return categoryId

    if (subcategoryId) {
        const subcategory = getSubcategoryById(categoryId, subcategoryId)
        if (subcategory) {
            return `${category.label} > ${subcategory.label}`
        }
    }

    return category.label
}

// For search/filter - flat list of searchable terms
export const searchableCategories = categories.flatMap(cat => [
    { id: cat.id, label: cat.label, type: 'category' as const },
    ...cat.subcategories.map(sub => ({
        id: `${cat.id}:${sub.id}`,
        label: sub.label,
        parentLabel: cat.label,
        type: 'subcategory' as const
    }))
])
