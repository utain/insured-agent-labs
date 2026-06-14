use crate::db::{CatalogProduct, CatalogRiderPlan, Modal, QuotationCalc, RiderPremium, RiderSelection};

/// Interpolate a rate from an age-keyed rate table.
fn rate_for_age(table: &[(i32, f64)], age: i32) -> f64 {
    if table.is_empty() {
        return 0.0;
    }
    // Below the first band → use first rate; above the last → use last rate.
    if age <= table[0].0 {
        return table[0].1;
    }
    for i in 0..table.len() - 1 {
        let (a0, r0) = table[i];
        let (a1, r1) = table[i + 1];
        if age >= a0 && age <= a1 {
            if a1 == a0 {
                return r0;
            }
            let t = (age - a0) as f64 / (a1 - a0) as f64;
            return r0 + t * (r1 - r0);
        }
    }
    table.last().unwrap().1
}

/// Term factor: longer terms cost slightly more (simplified).
fn term_factor(term: i32, product_code: &str) -> f64 {
    // Whole life (term 99) gets a small discount.
    if term >= 99 {
        return 0.95;
    }
    // Otherwise a mild increase: 10y=1.0, 30y=1.15.
    let factor = 1.0 + (term as f64 - 10.0) * 0.0075;
    // Endowment products are savings-heavy and have their own curve.
    if product_code == "LIFE_ENDOW" {
        factor * 0.8
    } else {
        factor
    }
}

/// Modal factors: how much of the annual premium each installment represents.
pub fn modal_factor(modal: Modal) -> f64 {
    match modal {
        Modal::Annual => 1.0,
        Modal::Semi => 0.52,
        Modal::Quarterly => 0.27,
        Modal::Monthly => 0.09,
    }
}

/// Calculate the full premium breakdown for a quotation.
/// If `bug_inflate` is true, inflate the base premium ~5% (agent.bug scenario).
pub fn calculate(
    product: &CatalogProduct,
    riders: &[(&CatalogRiderPlan, &RiderSelection)],
    age: i32,
    sum_assured: u64,
    term: i32,
    modal: Modal,
    bug_inflate: bool,
) -> QuotationCalc {
    // Base annual premium = (sum_assured / 1000) * rate(age) * term_factor
    let base_rate = rate_for_age(&product.rate_per_thousand, age);
    let mut base_premium = (sum_assured as f64 / 1000.0) * base_rate * term_factor(term, &product.code);
    if bug_inflate {
        base_premium *= 1.05;
    }

    // Rider premiums
    let rider_premiums: Vec<RiderPremium> = riders
        .iter()
        .map(|(plan, sel)| {
            let prem = if let Some(flat) = plan.flat_premium {
                flat
            } else if let Some(table) = &plan.rate_per_thousand {
                (sel.sum_assured as f64 / 1000.0) * rate_for_age(table, age)
            } else {
                0.0
            };
            RiderPremium {
                code: plan.code.clone(),
                premium: prem,
            }
        })
        .collect();

    let riders_total: f64 = rider_premiums.iter().map(|r| r.premium).sum();
    let total_annual_premium = base_premium + riders_total;
    let modal_premium = total_annual_premium * modal_factor(modal);

    QuotationCalc {
        base_premium: (base_premium * 100.0).round() / 100.0,
        rider_premiums,
        total_annual_premium: (total_annual_premium * 100.0).round() / 100.0,
        modal_premium: (modal_premium * 100.0).round() / 100.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{CatalogProduct, Modal};

    fn sample_product() -> CatalogProduct {
        CatalogProduct {
            code: "LIFE_TERM".into(),
            name_en: "Term".into(),
            name_th: "Term".into(),
            description_en: "".into(),
            description_th: "".into(),
            min_age: 18,
            max_age: 70,
            min_sum_assured: 100_000,
            max_sum_assured: 10_000_000,
            term_options: vec![10, 20, 30],
            rate_per_thousand: vec![(18, 2.0), (30, 3.5), (40, 6.0), (50, 10.0), (60, 18.0)],
        }
    }

    #[test]
    fn base_premium_calculation() {
        let p = sample_product();
        let calc = calculate(&p, &[], 35, 1_000_000, 20, Modal::Annual, false);
        // age 35: rate ≈ 3.5 + (35-30)/(40-30) * (6.0-3.5) = 3.5 + 0.5*2.5 = 4.75
        // term 20: factor = 1 + (20-10)*0.0075 = 1.075
        // base = 1000000/1000 * 4.75 * 1.075 = 1000 * 4.75 * 1.075 = 5106.25
        assert!((calc.base_premium - 5106.25).abs() < 0.1, "got {}", calc.base_premium);
        assert_eq!(calc.rider_premiums.len(), 0);
        assert!((calc.total_annual_premium - 5106.25).abs() < 0.1);
    }

    #[test]
    fn modal_factors() {
        let p = sample_product();
        let annual = calculate(&p, &[], 35, 1_000_000, 20, Modal::Annual, false);
        let monthly = calculate(&p, &[], 35, 1_000_000, 20, Modal::Monthly, false);
        // Monthly should be ~9% of annual total
        let ratio = monthly.modal_premium / annual.total_annual_premium;
        assert!((ratio - 0.09).abs() < 0.001, "got ratio {}", ratio);
    }

    #[test]
    fn bug_inflation() {
        let p = sample_product();
        let normal = calculate(&p, &[], 35, 1_000_000, 20, Modal::Annual, false);
        let buggy = calculate(&p, &[], 35, 1_000_000, 20, Modal::Annual, true);
        assert!(buggy.base_premium > normal.base_premium);
        assert!((buggy.base_premium / normal.base_premium - 1.05).abs() < 0.01);
    }
}
