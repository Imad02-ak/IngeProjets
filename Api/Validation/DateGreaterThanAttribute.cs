using System.ComponentModel.DataAnnotations;

namespace IngeProjets.Api.Validation;

/// <summary>
/// Validates that the annotated <see cref="DateTime"/> property is strictly after
/// another <see cref="DateTime"/> property on the same object.
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public sealed class DateGreaterThanAttribute : ValidationAttribute
{
    private readonly string _comparisonProperty;

    public DateGreaterThanAttribute(string comparisonProperty)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(comparisonProperty);
        _comparisonProperty = comparisonProperty;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is not DateTime currentValue)
            return ValidationResult.Success;

        var property = validationContext.ObjectType.GetProperty(_comparisonProperty);
        if (property is null)
            throw new ArgumentException($"Property '{_comparisonProperty}' not found on {validationContext.ObjectType.Name}.");

        var comparisonValue = property.GetValue(validationContext.ObjectInstance);

        if (comparisonValue is DateTime startDate && currentValue <= startDate)
        {
            return new ValidationResult(
                ErrorMessage ?? $"{validationContext.DisplayName} doit être postérieure à {_comparisonProperty}.",
                [validationContext.MemberName!]);
        }

        return ValidationResult.Success;
    }
}
