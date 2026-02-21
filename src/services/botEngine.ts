import { apiService } from './api';

export const botEngine = {
    processMessage: async (msg: string): Promise<string> => {
        const text = msg.toLowerCase();

        try {
            // Intent: Faturamento / Vendas
            if (text.includes('faturamento') || text.includes('vendas') || text.includes('vendi')) {
                const stats = await apiService.getDashboardStats();
                return `O faturamento total (Receita) do sistema consta como R$ ${stats.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Foram registradas ${stats.sales_count} vendas no total.`;
            }

            // Intent: Margem / Lucro
            if (text.includes('margem') || text.includes('lucro')) {
                const stats = await apiService.getDashboardStats();
                return `O lucro total acumulado nas vendas concluídas é de R$ ${stats.total_margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
            }

            // Intent: Clientes recorrentes / Top clientes
            if (text.includes('cliente')) {
                const customers = await apiService.getCustomers();
                return `Temos ${customers.length} clientes cadastrados atualmente na base do ERP.`;
            }

            // Intent: Peças paradas / Baixo estoque
            if (text.includes('parada') || text.includes('baixo') || text.includes('falta')) {
                const stats = await apiService.getDashboardStats();
                if (!stats.low_stock || stats.low_stock.length === 0) {
                    return "Não há peças em aviso de estoque baixo no momento. Tudo ok!";
                }
                return `Existem ${stats.low_stock.length} itens com estoque baixo. Destaque para: ${stats.low_stock.slice(0, 3).map(p => p.brand + ' ' + p.model).join(', ')}.`;
            }

            // Intent: Estoque por Categoria / Buscar Peça
            if (text.includes('estoque') || text.includes('peça') || text.includes('temos')) {
                const products = await apiService.getProducts();

                // Se mencionar uma marca
                const mentionedBrand = products.find(p => text.includes(p.brand.toLowerCase()));
                if (mentionedBrand) {
                    const count = products.filter(p => p.brand === mentionedBrand.brand).reduce((acc, curr) => acc + curr.quantity, 0);
                    return `Temos ${count} peças da marca ${mentionedBrand.brand} em estoque físico disponivel.`;
                }

                const total = products.reduce((acc, curr) => acc + curr.quantity, 0);
                return `O estoque total na loja conta com ${total} peças físicas divididas em ${products.length} cadastros de SKU únicos.`;
            }

            return "Sou o Assistente Determinístico de Estoque da Carlão Autopeças. Posso responder sobre 'faturamento', 'margem', 'estoque', 'clientes' ou 'peças em baixa'. Como posso ajudar?";
        } catch (e) {
            console.error(e);
            return "Enfrentei um erro de conexão ao buscar os dados reais. Tente novamente em instantes.";
        }
    }
};
