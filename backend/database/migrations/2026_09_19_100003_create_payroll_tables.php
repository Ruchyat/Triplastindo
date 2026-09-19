<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Karyawan dan penggajian.
 *
 * Satu payroll per bulan memuat satu baris per karyawan. Rumusnya mengikuti
 * tab GAJI KARYAWAN: kotor = pokok + lembur + allowance + bonus; bersih =
 * kotor − PPh 21 − BPJS; THP = bersih + pinjaman kasbon − potongan kasbon.
 * Jurnalnya terbentuk saat payroll diposting.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 32)->unique();
            $table->string('name');
            $table->enum('department', ['produksi', 'kantor', 'lapangan']);
            $table->string('position', 64)->nullable();
            $table->enum('employment_status', ['tetap', 'kontrak', 'harian'])->default('tetap');
            $table->date('joined_at')->nullable();
            $table->decimal('basic_salary', 18, 2)->default(0);
            $table->decimal('allowance', 18, 2)->default(0);
            // Akun beban gaji; bawaannya mengikuti departemen.
            $table->foreignId('expense_account_id')->constrained('accounts')->restrictOnDelete();
            $table->string('bank_account', 64)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->id();
            $table->string('number', 24)->unique();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->date('payment_date');
            $table->foreignId('cash_account_id')->constrained('accounts')->restrictOnDelete();
            $table->enum('status', ['draft', 'posted', 'cancelled'])->default('draft');
            $table->decimal('total_gross', 18, 2)->default(0);
            $table->decimal('total_net', 18, 2)->default(0);
            $table->decimal('total_take_home', 18, 2)->default(0);
            $table->foreignId('journal_entry_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['year', 'month']);
        });

        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_run_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->restrictOnDelete();
            $table->decimal('basic_salary', 18, 2)->default(0);
            $table->decimal('overtime', 18, 2)->default(0);
            $table->decimal('allowance', 18, 2)->default(0);
            $table->decimal('bonus', 18, 2)->default(0);
            $table->decimal('loan_advance', 18, 2)->default(0);
            $table->decimal('tax_pph21', 18, 2)->default(0);
            $table->decimal('bpjs_employment', 18, 2)->default(0);
            $table->decimal('bpjs_health', 18, 2)->default(0);
            $table->decimal('loan_deduction', 18, 2)->default(0);
            $table->decimal('gross', 18, 2)->default(0);
            $table->decimal('net', 18, 2)->default(0);
            $table->decimal('take_home', 18, 2)->default(0);
            $table->timestamps();

            $table->unique(['payroll_run_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_items');
        Schema::dropIfExists('payroll_runs');
        Schema::dropIfExists('employees');
    }
};
