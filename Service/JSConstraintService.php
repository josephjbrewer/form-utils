<?php

namespace JJB\FormUtilsBundle\Service;

use Symfony\Bundle\FrameworkBundle\Translation\Translator;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Constraints;

class JSConstraintService
{
    /**
     * @var Translator
     */
    private $translator;


    public function __construct(Translator $translator)
    {
        $this->translator = $translator;
    }

    /**
     * @param Constraint $constraint
     * @param null|string $domain
     * @param null|array $tests
     * @param null|array $messages
     * @return array
     */
    public function extractConstraints(Constraint $constraint, $domain = null, $tests = [], $messages = [])
    {
        if ($constraint instanceof Constraints\NotBlank) {
            $tests[]    = "__NOT_BLANK__";
            $messages[] = $this->trans($constraint->message, [], $domain);

        } else if ($constraint instanceof Constraints\Regex) {
            $tests[]    = trim($constraint->pattern, '/');
            $messages[] = $this->trans($constraint->message, [], $domain);

        } else if ($constraint instanceof Constraints\Length) {
            if ($constraint->min > 0 && $constraint->max > 0 && ($constraint->min === $constraint->max)) {
                $tests[]    = '^.{' . $constraint->min . ',' . $constraint->max . '}$';
                $_msg = $this->trans($constraint->exactMessage, [], $domain, $constraint->min);
                $messages[] = preg_replace('/\{\{\s?limit\s?\}\}/', $constraint->min, $_msg);
            } else {
                if ($constraint->min > 0) {
                    $tests[]    = '.{' . $constraint->min . ',}';
                    $_msg = $this->trans($constraint->minMessage, [], $domain, $constraint->min);
                    $messages[] = preg_replace('/\{\{\s?limit\s?\}\}/', $constraint->min, $_msg);
                }

                if ($constraint->max > 0) {
                    $tests[]    = '^.{0,' . $constraint->max . '}$';
                    $_msg = $this->trans($constraint->maxMessage, [], $domain, $constraint->max);
                    $messages[] = preg_replace('/\{\{\s?limit\s?\}\}/', $constraint->max, $_msg);
                }
            }
        } else if ($constraint instanceof Constraints\Email) {
            $tests[]    = "^.+\@\S+\.\S+$";
            $messages[] = $this->trans($constraint->message, [], $domain);

        } else if ($constraint instanceof Constraints\CardScheme) {
            $tests[]    = '__CARD_SCHEME__';
            $messages[] = $this->trans($constraint->message, [], $domain);

        } else if ($constraint instanceof Constraints\Date) {
            $tests[]    = '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';
            $messages[] = $this->trans($constraint->message, [], $domain);

        } else if ($constraint instanceof Constraints\Time) {
            $tests[]    = '^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$';
            $messages[] = $this->trans($constraint->message, [], $domain);

        } else if ($constraint instanceof Constraints\DateTime) {
            $tests[]    = '^[0-9]{4}-[0-9]{2}-[0-9]{2}\s[0-9]{2}\:[0-9]{2}\:[0-9]{2}$';
            $messages[] = $this->trans($constraint->message, [], $domain);

        } else if ($constraint instanceof Constraints\EqualTo) {
            $tests[]    = '^' . $constraint->value . '$';
            $messages[] = str_replace(
                '{{compared_value}}',
                $constraint->value,
                $this->trans($constraint->message, [], $domain)
            );

        } else if ($constraint instanceof Constraints\NotEqualTo) {
            $tests[]    = '^(?!' . $constraint->value . ').+$';
            $messages[] = str_replace(
                '{{compared_value}}',
                $constraint->value,
                $this->trans($constraint->message, [], $domain)
            );

        } else if ($constraint instanceof Constraints\GreaterThan) {
            $tests[]    = '__({{value}} > ' . $constraint->value . ')__';
            $messages[] = str_replace(
                '{{compared_value}}',
                $constraint->value,
                $this->trans($constraint->message, [], $domain)
            );

        } else if ($constraint instanceof Constraints\LessThan) {
            $tests[]    = '__({{value}} < ' . $constraint->value . ')__';
            $messages[] = str_replace(
                '{{compared_value}}',
                $constraint->value,
                $this->trans($constraint->message, [], $domain)
            );

        } else if ($constraint instanceof Constraints\GreaterThanOrEqual) {
            $tests[]    = '__({{value}} >= ' . $constraint->value . ')__';
            $messages[] = str_replace(
                '{{compared_value}}',
                $constraint->value,
                $this->trans($constraint->message, [], $domain)
            );

        } else if ($constraint instanceof Constraints\LessThanOrEqual) {
            $tests[]    = '__({{value}} <= ' . $constraint->value . ')__';
            $messages[] = str_replace(
                '{{compared_value}}',
                $constraint->value,
                $this->trans($constraint->message, [], $domain)
            );

        } else if ($constraint instanceof Constraints\Ip) {
            $tests[]    = '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$';
            $messages[] = $this->trans($constraint->message, [], $domain);

        } else if ($constraint instanceof Constraints\Url) {
            $tests[]    = '^(https?:\/\/)([\d\w]+)\.?([\d\w\-_]+)?\.([\d\w\-_]+\.([a-z0-9]{2,6}))(.*)$';
            $messages[] = $this->trans($constraint->message, [], $domain);

        } else if ($constraint instanceof Constraints\Luhn) {
            $tests[]    = '__LUHN__';
            $messages[] = $this->trans($constraint->message, [], $domain);

        }

        return [$tests, $messages];
    }

    /**
     * @param string $string
     * @param string array $params
     * @param string $domain
     * @param int $number
     * @return string
     */
    private function trans($string, array $params = [], $domain, $number = 1)
    {
        return $this->translator->transChoice($string, $number, $params, $domain);
    }
}