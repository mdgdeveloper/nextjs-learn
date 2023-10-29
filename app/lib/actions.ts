'use server';

import { z } from 'zod';
import { sql } from "@vercel/postgres";
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const InvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['paid', 'pending']),
    date: z.string(),
})

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoiceSchema.omit({ date: true });
const DeleteInvoice = InvoiceSchema.pick({ id: true });

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {

        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;

    } catch (e) {
        return {
            message: 'Database Error: Failed to create Invoice',
            error: e
        }
    }
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')

}

export async function updateInvoice(formData: FormData) {
    const { id, customerId, amount, status } = UpdateInvoice.parse({
        id: formData.get('id'),
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    const amountInCents = amount * 100;
    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;

    } catch (error) {
        return {
            message: 'Database Error: Failed to update Invoice',
            error: error
        }
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');

}

export async function deleteInvoice(formData: FormData) {
    throw new Error('Failed to Delete Invoice - Fake Error')
    const id = formData.get('id')?.toString();
    try {
        await sql`
            DELETE FROM invoices
            WHERE id = ${id}
            `;
        revalidatePath('/dashboard/invoices');
        return {
            message: 'Invoice deleted successfully'
        }

    } catch (error) {
        return {
            message: 'Database Error: Failed to delete Invoice',
            error: error
        }

    }
}
